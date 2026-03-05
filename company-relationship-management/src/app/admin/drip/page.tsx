import { redirect } from 'next/navigation';

export default function DripRedirect() {
    redirect('/admin/leads?tab=drip');
}
