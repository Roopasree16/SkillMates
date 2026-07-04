import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import PageBackground from "@/components/ui/PageBackground";

const Index = () => {
  return (
    <PageBackground variant="auth">
      <div className="min-h-screen">
        <Navbar />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <AboutSection />
        </main>
        <Footer />
      </div>
    </PageBackground>
  );
};

export default Index;
