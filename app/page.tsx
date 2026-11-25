import { UIIPublicLanding } from '@/components/uii-public-landing';
import { AuthRecoveryErrorForwarder } from '@/components/auth-recovery-error-forwarder';

export default function HomePage() {
  return <><AuthRecoveryErrorForwarder/><UIIPublicLanding/></>;
}
