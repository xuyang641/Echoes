import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiaryEntryForm, type DiaryEntry } from '../components/diary-entry-form';

// Lazy load views
const TimelineView = lazy(() => import('../components/timeline-view').then(module => ({ default: module.TimelineView })));
const CalendarView = lazy(() => import('../components/calendar-view').then(module => ({ default: module.CalendarView })));
const MapView = lazy(() => import('../components/map-view').then(module => ({ default: module.MapView })));
const InsightsView = lazy(() => import('../components/insights-view').then(module => ({ default: module.InsightsView })));
const MilestonesView = lazy(() => import('../components/milestones-view').then(module => ({ default: module.MilestonesView })));
const ChangelogView = lazy(() => import('../components/changelog-view').then(module => ({ default: module.ChangelogView })));
const PrintShopView = lazy(() => import('../components/print-shop-view').then(module => ({ default: module.PrintShopView })));
const AccountView = lazy(() => import('../components/account-view').then(module => ({ default: module.AccountView })));
const CoupleSplitView = lazy(() => import('../components/couple-split-view').then(module => ({ default: module.CoupleSplitView })));
const SharedBookView = lazy(() => import('../components/shared-book-view').then(module => ({ default: module.SharedBookView })));
const AboutView = lazy(() => import('../components/legal-pages').then(module => ({ default: module.AboutView })));
const PrivacyView = lazy(() => import('../components/legal-pages').then(module => ({ default: module.PrivacyView })));
const TermsView = lazy(() => import('../components/legal-pages').then(module => ({ default: module.TermsView })));
const SubscriptionView = lazy(() => import('../components/subscription-view').then(module => ({ default: module.SubscriptionView })));

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
              <AccountView />
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
          <Route path="/share/book/:id" element={
            <PageTransition>
              <SharedBookView />
            </PageTransition>
          } />
          <Route path="/add" element={
            <PageTransition>
              <div className="max-w-2xl mx-auto">
                <DiaryEntryForm onSave={onAddEntry} saving={saving} />
              </div>
            </PageTransition>
          } />
          <Route path="/edit/:id" element={
            <PageTransition>
              <div className="max-w-2xl mx-auto">
                <EditEntryWrapper entries={entries} onSave={onUpdateEntry} saving={saving} loading={loading} />
              </div>
            </PageTransition>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}