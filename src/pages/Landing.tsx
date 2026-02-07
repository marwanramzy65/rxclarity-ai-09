import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Zap, Users, CheckCircle, ArrowRight, Pill, AlertTriangle, Menu, X, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/pharma-hero.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Pill className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">
              PharmaVerse
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">
              Impact
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
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border animate-fade-in">
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                Impact
              </a>
              <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                Benefits
              </a>
              <div className="flex flex-col space-y-2 pt-2">
                <Button variant="outline" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                  Sign In
                </Button>
                <Button className="bg-gradient-primary shadow-medical" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in-left">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-white/80 text-sm">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span>AI-Powered Insurance Processing</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Revolutionize
                <br />
                <span className="text-primary-glow">Insurance Claims</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-lg">
                AI-powered pharmaceutical insurance processing with automated claims approval
                and drug interaction safety checks. Process claims in seconds, not hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elevated text-base" onClick={() => navigate('/auth')}>
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-base" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative animate-slide-in-right">
              <img
                src={heroImage}
                alt="PharmaVerse Dashboard"
                className="rounded-2xl shadow-elevated w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-elevated border animate-float">
                <div className="flex items-center space-x-3">
                  <div className="bg-success/10 rounded-full p-2">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Claim Approved</p>
                    <p className="text-xs text-muted-foreground">Processing time: 2.3s</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-card rounded-xl p-3 shadow-elevated border animate-float animation-delay-300 hidden sm:block">
                <div className="flex items-center space-x-2">
                  <div className="bg-primary/10 rounded-full p-1.5">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-medium">Drug Safety Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced AI technology meets pharmaceutical expertise to deliver unmatched efficiency
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-card border-0 shadow-card-medical hover:shadow-elevated transition-all duration-300 hover-lift card-shine animate-fade-in-up">
              <CardHeader>
                <div className="bg-primary/10 rounded-2xl p-4 w-fit mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Automated Insurance Processing</CardTitle>
                <CardDescription>
                  AI instantly reviews prescriptions against insurance policies for immediate approval decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Policy tier validation</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Coverage level checks</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Quantity limit verification</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Real-time decisions</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card-medical hover:shadow-elevated transition-all duration-300 hover-lift card-shine animate-fade-in-up animation-delay-200">
              <CardHeader>
                <div className="bg-accent/10 rounded-2xl p-4 w-fit mb-4">
                  <Shield className="h-8 w-8 text-accent" />
                </div>
                <CardTitle>Drug Interaction Safety</CardTitle>
                <CardDescription>
                  Advanced safety checks identify dangerous drug combinations before dispensing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Comprehensive interaction database</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Severity level classification</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Clinical recommendations</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Real-time alerts</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card-medical hover:shadow-elevated transition-all duration-300 hover-lift card-shine animate-fade-in-up animation-delay-400">
              <CardHeader>
                <div className="bg-warning/10 rounded-2xl p-4 w-fit mb-4">
                  <Users className="h-8 w-8 text-warning" />
                </div>
                <CardTitle>Seamless Integration</CardTitle>
                <CardDescription>
                  Easy integration with existing pharmacy systems and insurance workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>API-first architecture</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Existing system compatibility</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>Minimal setup required</span></li>
                  <li className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-success flex-shrink-0" /><span>24/7 support</span></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats / Social Proof Section */}
      <section id="stats" className="py-16 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center animate-fade-in-up">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div>
              <p className="text-white/70 text-sm">Pharmacies Onboarded</p>
            </div>
            <div className="text-center animate-fade-in-up animation-delay-100">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">2.3s</div>
              <p className="text-white/70 text-sm">Avg. Processing Time</p>
            </div>
            <div className="text-center animate-fade-in-up animation-delay-200">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">99.9%</div>
              <p className="text-white/70 text-sm">Uptime Guarantee</p>
            </div>
            <div className="text-center animate-fade-in-up animation-delay-300">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">1M+</div>
              <p className="text-white/70 text-sm">Claims Processed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose PharmaVerse?</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your pharmacy operations with cutting-edge AI technology
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start space-x-4 animate-fade-in-up">
                  <div className="bg-primary/10 rounded-2xl p-3 flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Lightning Fast Processing</h3>
                    <p className="text-muted-foreground">
                      Process insurance claims in seconds instead of waiting 30+ minutes for manual approval
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 animate-fade-in-up animation-delay-200">
                  <div className="bg-success/10 rounded-2xl p-3 flex-shrink-0">
                    <Shield className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Enhanced Patient Safety</h3>
                    <p className="text-muted-foreground">
                      Automatic drug interaction checks prevent dangerous combinations before dispensing
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 animate-fade-in-up animation-delay-400">
                  <div className="bg-warning/10 rounded-2xl p-3 flex-shrink-0">
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
            <div className="bg-gradient-card p-8 rounded-2xl shadow-elevated border border-border/50 animate-scale-in">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                Join hundreds of pharmacies already using PharmaVerse to streamline their operations
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>14-day free trial, no credit card required</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Full access to all features</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span>Dedicated onboarding support</span>
                </div>
              </div>
              <Button size="lg" className="w-full bg-gradient-primary shadow-medical text-base" onClick={() => navigate('/auth')}>
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
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Pill className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">
              PharmaVerse
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Impact</a>
            <a href="#benefits" className="hover:text-foreground transition-colors">Benefits</a>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            © 2026 PharmaVerse. Revolutionizing pharmaceutical insurance processing.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;