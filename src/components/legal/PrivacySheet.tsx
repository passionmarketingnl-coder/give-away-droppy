import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacySheet = ({ open, onOpenChange }: PrivacySheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-0">
      <SheetHeader className="px-6 pb-4">
        <SheetTitle className="text-xl font-extrabold">Privacybeleid</SheetTitle>
      </SheetHeader>
      <ScrollArea className="h-[calc(85vh-80px)] px-6">
        <div className="prose prose-sm max-w-none text-foreground pb-10 space-y-4">
          <p className="text-xs text-muted-foreground font-semibold">Versie 1.1</p>
          <p className="text-sm"><strong>Verwerkingsverantwoordelijke:</strong> BP Ecom | Het Kaar 7, 5527 GS Hapert | info@bpecom.nl | 085 060 1474 | KvK 77270320 | Btw-id NL003170097B04</p>

          <h3 className="text-base font-bold">Welke gegevens verzamelen wij?</h3>
          <p className="text-sm">Accountgegevens (naam, e-mail, wachtwoord versleuteld), locatiegegevens (afgeronde locatie voor 7km-filter, nooit exact adres), profielfoto (optioneel), plaatsingsgegevens (foto's, beschrijving), chatberichten, gebruiksgegevens (likes, wins) en technische gegevens (IP, apparaat).</p>

          <h3 className="text-base font-bold">Grondslag</h3>
          <p className="text-sm">Wij verwerken jouw gegevens op basis van: uitvoering van de overeenkomst (account en loting), gerechtvaardigd belang (veiligheid en misbruikpreventie) en toestemming (pushnotificaties, in te trekken via instellingen).</p>

          <h3 className="text-base font-bold">Locatiegegevens</h3>
          <p className="text-sm">Jouw locatie wordt uitsluitend gebruikt om producten binnen 7 km te tonen. Andere gebruikers zien alleen een afstandsindicatie, nooit jouw exacte locatie. Locatiegegevens worden niet met derden gedeeld.</p>

          <h3 className="text-base font-bold">Derden</h3>
          <p className="text-sm">Wij delen geen gegevens met derden voor commerciële doeleinden. Wij gebruiken Supabase (EU-opslag), Expo/Despia (app-publicatie, geen persoonsgegevens) en een hostingprovider. Alle verwerkers zijn gebonden aan een verwerkersovereenkomst.</p>

          <h3 className="text-base font-bold">Bewaartermijnen</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Accountgegevens: actieve periode + 12 maanden</li>
            <li>Plaatsingsgegevens: 6 maanden na loting</li>
            <li>Chatberichten: 12 maanden</li>
            <li>Meldingen: 24 maanden</li>
            <li>Loggegevens: 3 maanden</li>
          </ul>

          <h3 className="text-base font-bold">Jouw rechten</h3>
          <p className="text-sm">Je hebt recht op inzage, rectificatie, verwijdering, beperking, bezwaar en dataportabiliteit. Verzoeken via info@bpecom.nl, wij reageren binnen 30 dagen. Klachten bij de Autoriteit Persoonsgegevens via autoriteitpersoonsgegevens.nl.</p>

          <h3 className="text-base font-bold">Beveiliging</h3>
          <p className="text-sm">HTTPS/SSL-verbindingen, versleutelde wachtwoorden (bcrypt), beperkte databasetoegang, regelmatige beveiligingscontroles.</p>

          <h3 className="text-base font-bold">Cookies</h3>
          <p className="text-sm">Geen tracking cookies van derden. Alleen functionele sessiecookies.</p>

          <h3 className="text-base font-bold">Kinderen</h3>
          <p className="text-sm">Droppy is niet bestemd voor personen onder de 16 jaar. Vermoed je een minderjarig account? Mail info@bpecom.nl.</p>

          <h3 className="text-base font-bold">Wijzigingen</h3>
          <p className="text-sm">Wezenlijke wijzigingen worden gecommuniceerd via de app of e-mail. Actuele versie altijd beschikbaar onder Instellingen {'>'} Privacybeleid.</p>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
);

export default PrivacySheet;
