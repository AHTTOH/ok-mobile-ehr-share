import { Suspense } from 'react';
import ResetPasswordForm from './reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>로딩 중...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
