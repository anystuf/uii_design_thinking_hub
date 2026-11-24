import { redirect } from 'next/navigation';

/**
 * Compatibility entrypoint for confirmation emails and previously shared links.
 * The existing learning workspace owns sign-in and registration; do not
 * duplicate authentication forms or create a second session flow here.
 */
export default function LoginPage() {
  redirect('/learn');
}
