import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pill, ArrowLeft, SearchX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center animate-fade-in-up">
        <div className="bg-primary/10 rounded-full p-6 w-fit mx-auto mb-6">
          <SearchX className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
        <p className="text-xl text-foreground font-medium mb-2">Page not found</p>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button size="lg" className="bg-gradient-primary shadow-medical">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Home
          </Button>
        </Link>
        <div className="mt-12 flex items-center justify-center space-x-2 text-muted-foreground">
          <Pill className="h-5 w-5" />
          <span className="text-sm font-medium">PharmaVerse</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
