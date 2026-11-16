import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { I18nProvider } from "./i18n/I18nProvider";
import { Calendar } from "./screens/Calendar";
import { Dashboard } from "./screens/Dashboard";
import { LanguagePicker } from "./screens/LanguagePicker";
import { PresetPicker } from "./screens/PresetPicker";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SubscriptionDetail } from "./screens/SubscriptionDetail";
import { SubscriptionForm } from "./screens/SubscriptionForm";
import { SubscriptionList } from "./screens/SubscriptionList";
import { useReminderScheduler } from "./services/reminderScheduler";
import { useTraySync } from "./services/tray";
import { AppDataProvider, useAppData } from "./state/AppData";

function BackgroundTasks() {
  useReminderScheduler();
  useTraySync();
  return null;
}

function LocalizedApp() {
  const { settings, status } = useAppData();
  if (status === "ready" && !settings.languageChosen) {
    return (
      <I18nProvider lang={settings.language}>
        <BackgroundTasks />
        <LanguagePicker />
      </I18nProvider>
    );
  }
  return (
    <I18nProvider lang={settings.language}>
      <BackgroundTasks />
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="subscriptions" element={<SubscriptionList />} />
            <Route path="subscriptions/new" element={<PresetPicker />} />
            <Route path="subscriptions/new/:presetId" element={<SubscriptionForm />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
            <Route path="subscriptions/:id/edit" element={<SubscriptionForm />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </I18nProvider>
  );
}

export function App() {
  return (
    <AppDataProvider>
      <LocalizedApp />
    </AppDataProvider>
  );
}
