import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2, Mail, Lock, User, Phone, MapPin, Home } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import TermsSheet from "@/components/legal/TermsSheet";
import PrivacySheet from "@/components/legal/PrivacySheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";
import onboardingHero from "@/assets/onboarding-hero.png";

type Step = "welcome" | "login" | "register" | "verify";

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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const { toast } = useToast();

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast({ title: "Inloggen mislukt", description: String(result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    setLoading(false);
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
    // Save consent record
    const userId = data.user?.id;
    if (userId) {
      const now = new Date().toISOString();
      await supabase.from("user_consents").insert({
        user_id: userId,
        terms_accepted: true,
        terms_accepted_at: now,
        terms_version: "1.1",
        privacy_accepted: true,
        privacy_accepted_at: now,
        privacy_version: "1.1",
      });
    }
    // If no session, email confirmation is required
    if (!data.session) {
      setLoading(false);
      setStep("verify");
      return;
    }
    // Geocode address in background (only if auto-confirmed / session exists)
    try {
      await supabase.functions.invoke("geocode-address", {
        body: { postcode: cleanPostcode, house_number: houseNumber },
      });
    } catch (e) {
      console.warn("Geocoding failed, can be retried later", e);
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
            <div className="flex flex-col gap-3 mt-6 w-full max-w-xs items-center">
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
            <div className="flex items-center gap-3 mt-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">of</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl text-sm font-semibold"
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl text-sm font-semibold"
                onClick={() => handleSocialLogin("apple")}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Apple
              </Button>
            </div>
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

            {/* Consent checkboxes */}
            <div className="space-y-3 mt-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-foreground leading-snug">
                  Ik ga akkoord met de{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
                    className="text-primary font-semibold underline"
                  >
                    Algemene Voorwaarden
                  </button>
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacy"
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="privacy" className="text-sm text-foreground leading-snug">
                  Ik heb het{" "}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setPrivacyOpen(true); }}
                    className="text-primary font-semibold underline"
                  >
                    Privacybeleid
                  </button>{" "}
                  gelezen en ga hiermee akkoord
                </label>
              </div>
            </div>

            <Button
              onClick={handleRegister}
              className="w-full mt-6 h-14 text-base font-bold rounded-xl"
              disabled={!email || !password || !firstName || !lastName || !phone || !postcode || !houseNumber || !termsAccepted || !privacyAccepted || loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registreren"}
            </Button>
            <button
              onClick={() => setStep("login")}
              className="text-sm text-primary font-semibold mt-4 text-center"
            >
              Al een account? Log in
            </button>
            <div className="flex items-center gap-3 mt-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">of registreer met</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex gap-3 mt-4 pb-8">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl text-sm font-semibold"
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-xl text-sm font-semibold"
                onClick={() => handleSocialLogin("apple")}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Apple
              </Button>
            </div>
          </motion.div>
        )}

        {step === "verify" && (
          <motion.div
            key="verify"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground mb-3">Bevestig je e-mail</h2>
            <p className="text-muted-foreground mb-2 max-w-xs">
              We hebben een bevestigingslink gestuurd naar:
            </p>
            <p className="font-bold text-foreground mb-6">{email}</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Klik op de link in de e-mail om je account te activeren. Daarna kun je inloggen.
            </p>
            <Button
              onClick={() => setStep("login")}
              variant="outline"
              className="mt-8 h-12 rounded-xl px-8"
            >
              Ga naar inloggen
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <TermsSheet open={termsOpen} onOpenChange={setTermsOpen} />
      <PrivacySheet open={privacyOpen} onOpenChange={setPrivacyOpen} />
    </div>
  );
};

export default Auth;
