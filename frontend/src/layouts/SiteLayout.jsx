import { Outlet } from 'react-router-dom';
import FeedbackButton from '../components/FeedbackButton';
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader/>
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <FeedbackButton />
    </div>
  );
}
