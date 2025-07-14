import { ArrowRight, Cog, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-screws.jpg";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Cog className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">ScrewSavvy</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img 
            src={heroImage} 
            alt="Industrial screws and fasteners" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Find the Perfect Screw for 
              <span className="text-primary"> Every Project</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              AI-powered screw recommendation system that helps you choose the right fastener 
              based on your specific requirements and project needs.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-elegant hover:shadow-glow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MessagesSquare className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-center">Chat Assistant</CardTitle>
                  <CardDescription className="text-center">
                    Get instant screw recommendations through our AI-powered chat interface
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/chat">
                    <Button className="w-full bg-gradient-primary hover:bg-primary/90" size="lg">
                      Start Chatting
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-accent/50 transition-all duration-300 shadow-elegant hover:shadow-glow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-industrial rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Cog className="w-6 h-6 text-industrial-foreground" />
                  </div>
                  <CardTitle className="text-center">Admin Panel</CardTitle>
                  <CardDescription className="text-center">
                    Manage PDFs, update knowledge base, and configure system settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/admin">
                    <Button variant="secondary" className="w-full" size="lg">
                      Admin Access
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Precision Engineering Meets AI
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our system combines comprehensive screw documentation with advanced AI 
              to provide accurate recommendations for any project.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessagesSquare className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Intelligent Chat</h3>
              <p className="text-muted-foreground">
                Describe your project requirements and get personalized screw recommendations instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-industrial rounded-xl flex items-center justify-center mx-auto mb-4">
                <Cog className="w-8 h-8 text-industrial-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Knowledge</h3>
              <p className="text-muted-foreground">
                Powered by comprehensive PDF documentation covering all screw types and applications.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Results</h3>
              <p className="text-muted-foreground">
                Get precise recommendations in seconds, not hours of manual research.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;