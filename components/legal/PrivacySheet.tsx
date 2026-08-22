import { ScrollView, View } from 'react-native';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';

interface PrivacySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="text-base font-bold text-foreground">{title}</Text>
      <Text className="text-sm text-foreground leading-relaxed">{children}</Text>
    </View>
  );
}

export default function PrivacySheet({ open, onOpenChange }: PrivacySheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>
            <Text className="text-xl font-extrabold">Privacybeleid</Text>
          </DialogTitle>
        </DialogHeader>
        <ScrollView className="px-6" contentContainerClassName="pb-10 gap-4">
          <Text className="text-xs text-muted-foreground font-semibold">Versie 1.1</Text>
          <Text className="text-sm text-foreground leading-relaxed">
            Verwerkingsverantwoordelijke: BP Ecom, Het Kaar 7, 5527 GS Hapert,
            info@bpecom.nl, 085 060 1474, KvK 77270320, Btw-id NL003170097B04.
          </Text>

          <Section title="Welke gegevens verzamelen wij?">
            Accountgegevens (naam, e-mail, wachtwoord versleuteld), locatiegegevens
            (afgeronde locatie voor 7km-filter, nooit exact adres), profielfoto (optioneel),
            plaatsingsgegevens (foto&apos;s, beschrijving), chatberichten, gebruiksgegevens
            (likes, wins) en technische gegevens (IP, apparaat).
          </Section>

          <Section title="Grondslag">
            Wij verwerken jouw gegevens op basis van uitvoering van de overeenkomst
            (account en loting), gerechtvaardigd belang (veiligheid en misbruikpreventie)
            en toestemming (pushnotificaties, in te trekken via instellingen).
          </Section>

          <Section title="Locatiegegevens">
            Jouw locatie wordt uitsluitend gebruikt om producten binnen 7 km te tonen.
            Andere gebruikers zien alleen een afstandsindicatie, nooit jouw exacte locatie.
            Locatiegegevens worden niet met derden gedeeld.
          </Section>

          <Section title="Derden">
            Wij delen geen gegevens met derden voor commerciële doeleinden. Wij gebruiken
            Supabase (EU-opslag), Expo (app-publicatie, geen persoonsgegevens) en een
            hostingprovider. Alle verwerkers zijn gebonden aan een verwerkersovereenkomst.
          </Section>

          <Section title="Bewaartermijnen">
            Accountgegevens: actieve periode + 12 maanden. Plaatsingsgegevens: 6 maanden na
            loting. Chatberichten: 12 maanden. Meldingen: 24 maanden. Loggegevens: 3
            maanden.
          </Section>

          <Section title="Jouw rechten">
            Je hebt recht op inzage, rectificatie, verwijdering, beperking, bezwaar en
            dataportabiliteit. Verzoeken via info@bpecom.nl, wij reageren binnen 30 dagen.
            Klachten bij de Autoriteit Persoonsgegevens via autoriteitpersoonsgegevens.nl.
          </Section>

          <Section title="Beveiliging">
            HTTPS/SSL-verbindingen, versleutelde wachtwoorden (bcrypt), beperkte
            databasetoegang, regelmatige beveiligingscontroles.
          </Section>

          <Section title="Cookies">
            Geen tracking cookies van derden. Alleen functionele sessiecookies.
          </Section>

          <Section title="Kinderen">
            Droppi is niet bestemd voor personen onder de 16 jaar. Vermoed je een
            minderjarig account? Mail info@bpecom.nl.
          </Section>

          <Section title="Wijzigingen">
            Wezenlijke wijzigingen worden gecommuniceerd via de app of e-mail. Actuele
            versie altijd beschikbaar onder Instellingen &gt; Privacybeleid.
          </Section>
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}
