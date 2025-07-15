import * as admin from "firebase-admin";

// Firebase 앱을 초기화합니다.
admin.initializeApp();

// 우리가 만든 실제 일꾼(로봇)을 수입해서,
// 'dailyCondoUpdate'라는 이름으로 외부에 수출(등록)합니다.
export { updateAllHanwhaData as dailyCondoUpdate } from "./api/condoLookups";