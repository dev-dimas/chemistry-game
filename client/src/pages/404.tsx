import { useNavigate } from "@/router";
import { Button } from "@/components/Button";
import { BackgroundPattern } from "@/components/BackgroundPattern";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden bg-indigo-900">
      <BackgroundPattern />

      <div className="relative z-10 bg-white p-8 rounded-[40px] shadow-2xl max-w-md w-full text-center border-8 border-blue-100">
        <div className="mb-6 font-black text-blue-400 select-none text-9xl">
          404
        </div>

        <h1 className="mb-2 text-3xl font-black text-blue-900">
          Page Not Found
        </h1>

        <p className="mb-8 text-lg font-medium text-gray-500">
          The page you are looking for does not exist.
        </p>

        <Button
          onClick={() => navigate("/")}
          className="w-full transform hover:-translate-y-1"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
}
