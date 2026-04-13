import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiaryEntryForm } from '../components/diary-entry-form';
import type { DiaryEntry } from '../types/diary';

// Lazy load views
const TimelineView = lazy(() => import('../views/timeline-view').then(module => ({ default: module.TimelineView })));
const CalendarView = lazy(() => import('../views/calendar-view').then(module => ({ default: module.CalendarView })));
const MapView = lazy(() => import('../views/map-view').then(module => ({ default: module.MapView })));
const InsightsView = lazy(() => import('../views/insights-view').then(module => ({ default: module.InsightsView })));
const MilestonesView = lazy(() => import('../views/milestones-view').then(module => ({ default: module.MilestonesView })));
const ChangelogView = lazy(() => import('../views/changelog-view').then(module => ({ default: module.ChangelogView })));
const PrintShopView = lazy(() => import('../views/print-shop-view').then(module => ({ default: module.PrintShopView })));
const AccountView = lazy(() => import('../views/account-view').then(module => ({ default: module.AccountView })));
const CoupleSplitView = lazy(() => import('../views/couple-split-view').then(module => ({ default: module.CoupleSplitView })));
const SharedBookView = lazy(() => import('../views/shared-book-view').then(module => ({ default: module.SharedBookView })));
const AboutView = lazy(() => import('../components/legal-pages').then(module => ({ default: module.AboutView })));
const PrivacyView = lazy(() => import('../components/legal-pages').then(module => ({ default: module.PrivacyView })));
const TermsView = lazy(() => import('../components/legal-pages').then(module => ({ default: module.TermsView })));
const SubscriptionView = lazy(() => import('../views/subscription-view').then(module => ({ default: module.SubscriptionView })));
const NotificationsView = lazy(() => import('../views/notifications-view').then(module => ({ default: module.NotificationsView })));

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    transition={{ duration: 0.25, ease: "easeInOut" }}
    className="w-full h-full"
  >
    {children}
  </motion.div>
);

// Wrapper to handle finding the entry for editing
function EditEntryWrapper({ entries, onSave, saving, loading }: { entries: DiaryEntry[], onSave: (entry: DiaryEntry, targetGroups: string[]) => void, saving: boolean, loading: boolean }) {
  const { id } = useParams();
  const entry = entries.find(e => e.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl text-gray-900">Entry not found</h3>
        <p className="text-gray-500 mt-2">The memory you are trying to edit does not exist.</p>
      </div>
    );
  }

  return <DiaryEntryForm initialData={entry} onSave={onSave} saving={saving} isEdit />;
}

interface AppRoutesProps {
  entries: DiaryEntry[];
  loading: boolean;
  saving: boolean;
  onDeleteEntry: (id: string) => Promise<void>;
  onAddEntry: (entry: DiaryEntry, targetGroups: string[]) => Promise<void>;
  onUpdateEntry: (entry: DiaryEntry, targetGroups: string[]) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function AppRoutes({ entries, loading, saving, onDeleteEntry, onAddEntry, onUpdateEntry, onRefresh }: AppRoutesProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleAddEntry = async (entry: DiaryEntry, targetGroups: string[]) => {
    await onAddEntry(entry, targetGroups);
    navigate('/');
  };

  const handleUpdateEntry = async (entry: DiaryEntry, targetGroups: string[]) => {
    await onUpdateEntry(entry, targetGroups);
    navigate('/');
  };

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <PageTransition>
              <TimelineView 
                entries={entries} 
                onDeleteEntry={onDeleteEntry} 
                loading={loading}
                onRefresh={onRefresh}
              />
            </PageTransition>
          } />
          <Route path="/calendar" element={
            <PageTransition>
              <CalendarView 
                entries={entries} 
                onDeleteEntry={onDeleteEntry} 
              />
            </PageTransition>
          } />
          <Route path="/couple" element={
            <PageTransition>
              <CoupleSplitView />
            </PageTransition>
          } />
          <Route path="/map" element={
            <PageTransition>
              <MapView entries={entries} onUpdateEntry={onUpdateEntry} />
            </PageTransition>
          } />
          <Route path="/insights" element={
            <PageTransition>
              <InsightsView entries={entries} />
            </PageTransition>
          } />
          <Route path="/milestones" element={
            <PageTransition>
              <MilestonesView entries={entries} />
            </PageTransition>
          } />
          <Route path="/print" element={
            <PageTransition>
              <PrintShopView entries={entries} />
            </PageTransition>
          } />
          <Route path="/account" element={
            <PageTransition>
              <AccountView entries={entries} />
            </PageTransition>
          } />
          <Route path="/changelog" element={
            <PageTransition>
              <ChangelogView />
            </PageTransition>
          } />
          <Route path="/about" element={
            <PageTransition>
              <AboutView />
            </PageTransition>
          } />
          <Route path="/privacy" element={
            <PageTransition>
              <PrivacyView />
            </PageTransition>
          } />
          <Route path="/terms" element={
            <PageTransition>
              <TermsView />
            </PageTransition>
          } />
          <Route path="/subscription" element={
            <PageTransition>
              <SubscriptionView />
            </PageTransition>
          } />
          <Route path="/notifications" element={
            <PageTransition>
              <NotificationsView />
            </PageTransition>
          } />
          <Route path="/share/book/:id" element={
            <PageTransition>
              <SharedBookView />
            </PageTransition>
          } />
          <Route path="/add" element={
            <PageTransition>
              <div className="max-w-2xl mx-auto">
                <DiaryEntryForm 
                  onSave={handleAddEntry} 
                  saving={saving} 
                  initialCaption={new URLSearchParams(location.search).get('prompt') || undefined}
                />
              </div>
            </PageTransition>
          } />
          <Route path="/edit/:id" element={
            <PageTransition>
              <div className="max-w-2xl mx-auto">
                <EditEntryWrapper entries={entries} onSave={handleUpdateEntry} saving={saving} loading={loading} />
              </div>
            </PageTransition>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}