import Link from 'next/link';
import { FocusedLearningHub } from '@/components/focused-learning-hub';

export default function Page() {
  return (
    <>
      <div className="fixed right-5 top-5 z-50">
        <Link
          href="/learn"
          className="rounded-full bg-[#153b77] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#214c91] focus:outline focus:outline-2 focus:outline-orange-500"
        >
          Live Learning MVP →
        </Link>
      </div>
      <FocusedLearningHub />
    </>
  );
}
