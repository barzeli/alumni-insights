import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/button";

const Login = () => {
  const { googleLogin, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">
          Alumni Insights Login
        </h1>
        <p className="text-slate-600 mb-8">
          Please sign in with your Google account to access the dashboard.
        </p>
        <div className="flex justify-center">
          <Button
            onClick={() => googleLogin()}
            className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
          >
            <img
              src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
              alt="Google"
              className="w-6 h-6"
            />
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
