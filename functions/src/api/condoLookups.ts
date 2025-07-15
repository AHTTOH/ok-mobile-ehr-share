import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const secretManager = new SecretManagerServiceClient();

// Secret Manager에서 비밀 값을 가져오는 도우미 함수
async function getSecret(secretName: string): Promise<string> {
  const [version] = await secretManager.accessSecretVersion({
    name: `projects/mobile-ehr-20/secrets/${secretName}/versions/latest`, // 중요: YOUR_PROJECT_ID를 실제 프로젝트 ID로 바꾸세요!
  });
  return version.payload?.data?.toString() ?? "";
}

// 2단계 로그인 및 데이터 수집을 모두 수행하는 메인 로직
export const updateAllHanwhaData = functions
  .runWith({ secrets: ["hanwha-id", "hanwha-password", "hanwha-membership-password"] })
  .region("asia-northeast3")
  .pubsub.schedule("0 3 * * *") // 매일 새벽 3시에 실행
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    try {
      // --- 1단계: 1차 로그인 (ID/PW) ---
      console.log("1단계: 1차 로그인을 시도합니다...");
      const userId = await getSecret("hanwha-id");
      const userPw = await getSecret("hanwha-password");

      const loginResponse = await axios.post(
        "https://www.hanwharesort.co.kr/irsweb/resort3/member/login.do",
        new URLSearchParams({ "cyber_id": userId, "password": userPw }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          maxRedirects: 0,
          validateStatus: (status) => status === 302, // 302 Found가 성공 신호
        }
      );
      const cookieStep1 = loginResponse.headers["set-cookie"];
      if (!cookieStep1) throw new Error("1차 로그인 실패: 쿠키를 받지 못했습니다.");
      console.log("1단계 성공: 1차 입장권을 획득했습니다.");

      // --- 2단계: 2차 인증 (법인회원 비밀번호) ---
      console.log("2단계: 2차 인증을 시도합니다...");
      const membershipPassword = await getSecret("hanwha-membership-password");

      const membershipResponse = await axios.post(
        "https://www.hanwharesort.co.kr/irsweb/resort3/member/login_membership_password.do",
        new URLSearchParams({
            "cust_no": "0000624569", // Payload에서 확인된 값
            "cyber_id": userId,
            "password": "0808", // Payload에 있던 값, 실제 비밀번호와 다를 수 있음
            "membership_password": membershipPassword
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookieStep1.join('; ') // 1단계에서 받은 입장권을 제출
          },
          maxRedirects: 0,
          validateStatus: (status) => status === 302,
        }
      );
      const cookieStep2 = membershipResponse.headers["set-cookie"];
      if (!cookieStep2) throw new Error("2차 인증 실패: 최종 입장권을 받지 못했습니다.");
      console.log("2단계 성공: 최종 입장권을 획득했습니다.");
      
      const finalCookies = [...cookieStep1, ...cookieStep2];

      // --- 3단계: 실제 데이터 조회 (콘도 방 정보) ---
      console.log("3단계: 최종 입장권으로 콘도 방 정보를 조회합니다...");
      const roomResponse = await axios.post(
        "https://booking.hanwharesort.co.kr/rst/rst0010/doExecute.mvc",
        { "ds_search": [{ /* 이전에 찾았던 Payload 내용 */ }] }, // 여기에 실제 Payload를 채워주세요.
        { headers: { 'Cookie': finalCookies.join('; ') } }
      );
      
      const roomData = roomResponse.data.ds.Data.ds_result;
      const roomNames = new Set<string>();
      for (const room of roomData) {
        if (room.ROOM_TYPE_NM) roomNames.add(room.ROOM_TYPE_NM);
      }
      
      // --- 4단계: Firestore에 데이터 저장 ---
      await admin.firestore().collection("condoRoomTypes").doc("hanwhaSeorak").set({
        name: "한화리조트 설악",
        rooms: Array.from(roomNames),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("✅ 모든 작업 성공! Firestore에 데이터를 저장했습니다.");

    } catch (error) {
      console.error("❌ 자동화 작업 중 오류가 발생했습니다:", error);
    }
  });