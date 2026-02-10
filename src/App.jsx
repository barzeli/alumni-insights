import { PAGES, MAIN_PAGE } from "./pages.config";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { PageNotFound, Login } from "./pages";
import { AuthProvider, useAuth } from "./context/AuthContext";
import UserNotRegisteredError from "./pages/UserNotRegisteredError";
import AutoSyncManager from "./components/system/AutoSyncManager";
import Layout from "./Layout";

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  );

const AuthenticatedApp = () => {
  const { isLoadingAuth, authError, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError && authError.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {Object.entries(PAGES).map(([path, Page]) => (
        <Route
          key={path}
          path={path === MAIN_PAGE ? "/" : `/${path}`}
          element={
            isAuthenticated ? (
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AutoSyncManager />
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
