import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import onboardingHero from "@/assets/onboarding-hero.png";

type Step = "welcome" | "phone" | "otp" | "details" | "address";

const Auth = () => {
  const [step, setStep] = useState<Step>("welcome");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    postcode: "",
    house_number: "",
  });

  const slideVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  const formatPhone = (raw: string) => {
    let cleaned = raw.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("06")) {
      cleaned = "+316" + cleaned.slice(2);
    } else if (cleaned.startsWith("6") && !cleaned.startsWith("+")) {
      cleaned = "+316" + cleaned.slice(1);
    } else if (!cleaned.startsWith("+")) {
      cleaned = "+31" + cleaned;
    }
    return cleaned;
  };

  const handleSendOtp = async () => {
    setLoading(true);
    const formattedPhone = formatPhone(phone);
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    setLoading(false);
    if (error) {
      toast({ title: "Fout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Code verstuurd!", description: `SMS naar ${formattedPhone}` });
      setStep("otp");
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    const formattedPhone = formatPhone(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Verificatie mislukt", description: error.message, variant: "destructive" });
    } else {
      setStep("details");
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("profiles").update({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      postcode: form.postcode,
      house_number: form.house_number,
      display_location: form.postcode.replace(/\s/g, "").slice(0, 4),
    }).eq("id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Fout bij opslaan", description: error.message, variant: "destructive" });
    } else {
      window.location.href = "/";
    }
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
              onClick={() => setStep("phone")}
              className="w-full max-w-xs mt-10 h-14 text-base font-bold rounded-xl"
              size="lg"
            >
              Aan de slag
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === "phone" && (
          <motion.div
            key="phone"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col px-6 pt-16"
          >
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Wat is je nummer?</h2>
            <p className="text-muted-foreground mb-8">
              We sturen een code om je account te verifiëren.
            </p>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="+31 6 12345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-12 h-14 text-lg rounded-xl"
              />
            </div>
            <Button
              onClick={handleSendOtp}
              className="w-full mt-6 h-14 text-base font-bold rounded-xl"
              disabled={phone.length < 8 || loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Stuur code <ArrowRight className="w-5 h-5 ml-2" /></>}
            </Button>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col px-6 pt-16"
          >
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Voer de code in</h2>
            <p className="text-muted-foreground mb-8">
              We hebben een SMS gestuurd naar {formatPhone(phone)}
            </p>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="h-14 text-2xl text-center tracking-[0.5em] rounded-xl font-bold"
              maxLength={6}
            />
            <Button
              onClick={handleVerifyOtp}
              className="w-full mt-6 h-14 text-base font-bold rounded-xl"
              disabled={otp.length < 6 || loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verifiëren <ArrowRight className="w-5 h-5 ml-2" /></>}
            </Button>
            <button
              onClick={handleSendOtp}
              className="text-sm text-primary font-semibold mt-4 text-center"
            >
              Geen code ontvangen? Opnieuw sturen
            </button>
          </motion.div>
        )}

        {step === "details" && (
          <motion.div
            key="details"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col px-6 pt-16"
          >
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Over jou</h2>
            <p className="text-muted-foreground mb-6">Hoe mogen we je noemen?</p>
            <div className="space-y-4">
              <Input
                placeholder="Voornaam"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="h-14 text-base rounded-xl"
              />
              <Input
                placeholder="Achternaam"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="h-14 text-base rounded-xl"
              />
              <Input
                type="email"
                placeholder="E-mailadres"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-14 text-base rounded-xl"
              />
            </div>
            <Button
              onClick={() => setStep("address")}
              className="w-full mt-6 h-14 text-base font-bold rounded-xl"
              disabled={!form.first_name || !form.last_name || !form.email}
            >
              Volgende
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === "address" && (
          <motion.div
            key="address"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col px-6 pt-16"
          >
            <h2 className="text-2xl font-extrabold text-foreground mb-2">Waar woon je?</h2>
            <p className="text-muted-foreground mb-6">
              We tonen alleen spullen in jouw buurt (max 12 km).
            </p>
            <div className="space-y-4">
              <Input
                placeholder="Postcode (bijv. 1234 AB)"
                value={form.postcode}
                onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                className="h-14 text-base rounded-xl"
              />
              <Input
                placeholder="Huisnummer"
                value={form.house_number}
                onChange={(e) => setForm({ ...form, house_number: e.target.value })}
                className="h-14 text-base rounded-xl"
              />
            </div>
            <div className="flex items-start gap-3 mt-4 p-4 rounded-xl bg-primary/5">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Je exacte adres wordt nooit gedeeld. Alleen je buurt is zichtbaar.
              </p>
            </div>
            <Button
              onClick={handleSaveProfile}
              className="w-full mt-6 h-14 text-base font-bold rounded-xl"
              disabled={!form.postcode || !form.house_number || loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start met Droppy <CheckCircle className="w-5 h-5 ml-2" /></>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
