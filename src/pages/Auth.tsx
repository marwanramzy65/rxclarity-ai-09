import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pill, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    pharmacyName: ""
  });

  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Error signing in",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in."
          });
          navigate('/dashboard');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Password mismatch",
            description: "Passwords do not match.",
            variant: "destructive"
          });
          return;
        }

        const userData = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          pharmacy_name: formData.pharmacyName
        };

        const { error } = await signUp(formData.email, formData.password, userData);
        if (error) {
          toast({
            title: "Error creating account",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account."
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center text-white hover:text-primary-glow transition-colors mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Pill className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">PharmaVerse</span>
          </div>
        </div>

        <Card className="shadow-elevated border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin 
                ? "Sign in to access your pharmacy dashboard" 
                : "Join PharmaVerse to streamline your operations"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="John" 
                        className="border-input focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Doe" 
                        className="border-input focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pharmacy">Pharmacy Name</Label>
                    <Input 
                      id="pharmacyName"
                      value={formData.pharmacyName}
                      onChange={handleInputChange}
                      placeholder="Your Pharmacy Name" 
                      className="border-input focus:ring-primary"
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="pharmacist@example.com" 
                  className="border-input focus:ring-primary"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="border-input focus:ring-primary"
                  required
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="border-input focus:ring-primary"
                    required
                  />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-primary shadow-medical"
                size="lg"
              >
                {loading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <Button 
                variant="link" 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary-glow p-0"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;