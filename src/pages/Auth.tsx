import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2, Mail, Lock, User, Phone, MapPin, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import onboardingHero from "@/assets/onboarding-hero.png";

type Step = "welcome" | "login" | "register";

const Auth = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Inloggen mislukt", description: error.message, variant: "destructive" });
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    const cleanPostcode = postcode.toUpperCase().replace(/\s/g, '');
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, phone_number: phone, postcode: cleanPostcode, house_number: houseNumber },
      },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Registratie mislukt", description: error.message, variant: "destructive" });
      return;
    }
    // Geocode address in background
    if (data.session) {
      try {
        await supabase.functions.invoke("geocode-address", {
          body: { postcode: cleanPostcode, house_number: houseNumber },
        });
      } catch (e) {
        console.warn("Geocoding failed, can be retried later", e);
      }
    }
    setLoading(false);
    toast({ title: "Account aangemaakt!", description: "Je bent nu ingelogd." });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center px-6 py-12"
          >
            <div className="w-full max-w-xs mb-8">
              <img src={onboardingHero} alt="Buren delen spullen" className="w-full rounded-2xl" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground text-center mb-3">
              Welkom bij <span className="text-primary">Droppy</span>
            </h1>
            <p className="text-base text-muted-foreground text-center mb-2 max-w-xs">
              Geef gratis weg aan je buren. Eerlijk verloot, makkelijk opgehaald.
            </p>
            <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Plaats iets gratis in je buurt</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Buren doen mee met 1 tik</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span>Automatisch eerlijk verloot</span>
              </div>
            </div>
            <Button
              onClick={() => setStep("login")}
              className="w-full max-w-xs mt-10 h-14 text-base font-bold rounded-xl"
              size="lg"
            >
              Aan de slag
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === "login" && (
          <motion.div
            key="login"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col px-6 pt-16"
          >
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Inloggen</h2>
            <p className="text-muted-foreground mb-8">Log in met je e-mail en wachtwoord.</p>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="E-mailadres"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Wachtwoord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl"
                />
              </div>
            </div>
            <Button
              onClick={handleLogin}
              className="w-full mt-6 h-14 text-base font-bold rounded-xl"
              disabled={!email || !password || loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Inloggen"}
            </Button>
            <button
              onClick={() => setStep("register")}
              className="text-sm text-primary font-semibold mt-4 text-center"
            >
              Nog geen account? Registreer je
            </button>
          </motion.div>
        )}

        {step === "register" && (
          <motion.div
            key="register"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col px-6 pt-16"
          >
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Account aanmaken</h2>
            <p className="text-muted-foreground mb-8">Vul je gegevens in om te starten.</p>
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Voornaam"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl"
                />
              </div>
              <Input
                placeholder="Achternaam"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-14 text-base rounded-xl"
              />
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="Telefoonnummer"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl"
                />
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Postcode"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="pl-12 h-14 text-base rounded-xl"
                    maxLength={7}
                  />
                </div>
                <div className="relative w-28">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Nr."
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="pl-12 h-14 text-base rounded-xl"
                  />
                </div>
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="E-mailadres"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Wachtwoord (min. 6 tekens)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl"
                />
              </div>
            </div>
            <Button
              onClick={handleRegister}
              className="w-full mt-6 h-14 text-base font-bold rounded-xl"
              disabled={!email || !password || !firstName || !lastName || !phone || !postcode || !houseNumber || loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registreren"}
            </Button>
            <button
              onClick={() => setStep("login")}
              className="text-sm text-primary font-semibold mt-4 text-center"
            >
              Al een account? Log in
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
