import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Zap, Users, CheckCircle, ArrowRight, Pill, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/pharma-hero.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Pill className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PharmaVerse
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">
              Benefits
            </a>
            <Button variant="outline" className="mr-2" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button className="bg-gradient-primary shadow-medical" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Revolutionize
                <br />
                <span className="text-primary-glow">Insurance Claims</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                AI-powered pharmaceutical insurance processing with automated claims approval 
                and drug interaction safety checks. Process claims in seconds, not hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elevated" onClick={() => navigate('/auth')}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="PharmaVerse Dashboard" 
                className="rounded-2xl shadow-elevated w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-card rounded-lg p-4 shadow-elevated border">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-8 w-8 text-success" />
                  <div>
                    <p className="font-semibold">Claim Approved</p>
                    <p className="text-sm text-muted-foreground">Processing time: 2.3s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced AI technology meets pharmaceutical expertise to deliver unmatched efficiency
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-card border-0 shadow-card-medical hover:shadow-elevated transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Automated Insurance Processing</CardTitle>
                <CardDescription>
                  AI instantly reviews prescriptions against insurance policies for immediate approval decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Policy tier validation</li>
                  <li>• Coverage level checks</li>
                  <li>• Quantity limit verification</li>
                  <li>• Real-time decisions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card-medical hover:shadow-elevated transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Drug Interaction Safety</CardTitle>
                <CardDescription>
                  Advanced safety checks identify dangerous drug combinations before dispensing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Comprehensive interaction database</li>
                  <li>• Severity level classification</li>
                  <li>• Clinical recommendations</li>
                  <li>• Real-time alerts</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card-medical hover:shadow-elevated transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-warning mb-4" />
                <CardTitle>Seamless Integration</CardTitle>
                <CardDescription>
                  Easy integration with existing pharmacy systems and insurance workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• API-first architecture</li>
                  <li>• Existing system compatibility</li>
                  <li>• Minimal setup required</li>
                  <li>• 24/7 support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose PharmaVerse?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your pharmacy operations with cutting-edge AI technology
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 rounded-full p-3">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Lightning Fast Processing</h3>
                    <p className="text-muted-foreground">
                      Process insurance claims in seconds instead of waiting 30+ minutes for manual approval
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-success/10 rounded-full p-3">
                    <Shield className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Enhanced Patient Safety</h3>
                    <p className="text-muted-foreground">
                      Automatic drug interaction checks prevent dangerous combinations before dispensing
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-warning/10 rounded-full p-3">
                    <AlertTriangle className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Reduced Liability</h3>
                    <p className="text-muted-foreground">
                      Comprehensive safety checks and audit trails protect your pharmacy from liability
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-card p-8 rounded-2xl shadow-elevated">
              <h3 className="text-2xl font-bold mb-6">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                Join hundreds of pharmacies already using PharmaVerse to streamline their operations
              </p>
              <Button size="lg" className="w-full bg-gradient-primary shadow-medical" onClick={() => navigate('/auth')}>
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <Pill className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              PharmaVerse
            </span>
          </div>
          <p className="text-center text-muted-foreground">
            © 2025 PharmaVerse. Revolutionizing pharmaceutical insurance processing.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;