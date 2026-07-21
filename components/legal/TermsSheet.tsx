import { ScrollView, View } from 'react-native';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';

interface TermsSheetProps {
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

export default function TermsSheet({ open, onOpenChange }: TermsSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>
            <Text className="text-xl font-extrabold">Algemene Voorwaarden</Text>
          </DialogTitle>
        </DialogHeader>
        <ScrollView className="px-6" contentContainerClassName="pb-10 gap-4">
          <Text className="text-xs text-muted-foreground font-semibold">Versie 1.1</Text>

          <Section title="Artikel 1, Definities">
            Droppi: het platform (app en website) waarop gebruikers gratis producten kunnen
            aanbieden en ontvangen via een lotingssysteem, aangeboden door BP Ecom.
            BP Ecom: eigenaar en exploitant, Het Kaar 7, 5527 GS Hapert, KvK 77270320.
            Gebruiker: iedere natuurlijke persoon die een account aanmaakt.
            Aanbieder: gebruiker die een product plaatst. Deelnemer: gebruiker die via een
            like meedoet. Winnaar: deelnemer die door de automatische loting is gekozen.
            Product: goed dat gratis wordt aangeboden. Loting: automatisch proces na
            minimaal 4 uur, bij 100 likes of na 24 uur, afhankelijk wat zich eerst voordoet.
          </Section>

          <Section title="Artikel 2, Toepasselijkheid">
            Deze Algemene Voorwaarden zijn van toepassing op ieder gebruik van Droppi.
            Door een account aan te maken verklaar je deze voorwaarden te hebben gelezen
            en te aanvaarden. Het aanmaken van een account impliceert dat je aansprakelijk
            kunt worden gesteld voor schade veroorzaakt door handelen in strijd met deze
            voorwaarden.
          </Section>

          <Section title="Artikel 3, Het platform">
            Droppi is een gratis platform voor het lokaal weggeven van producten binnen 7
            km. Droppi treedt uitsluitend op als technisch tussenpersoon en is geen partij
            in de overdracht van producten. BP Ecom behoudt het recht het platform te
            wijzigen of te beëindigen zonder voorafgaande kennisgeving.
          </Section>

          <Section title="Artikel 4, Account en registratie">
            Je dient minimaal 18 jaar oud te zijn, correcte gegevens te verstrekken en je
            inloggegevens vertrouwelijk te houden. Door registratie ga je een overeenkomst
            aan met BP Ecom en accepteer je dat BP Ecom je aansprakelijk kan stellen voor
            schade die voortvloeit uit handelen in strijd met deze voorwaarden of uit het
            verstrekken van onjuiste gegevens.
          </Section>

          <Section title="Artikel 5, Plaatsen van producten">
            De aanbieder is volledig verantwoordelijk voor geplaatste producten. Verboden
            zijn illegale, gevaarlijke of schadelijke producten, levende dieren, voedsel,
            geneesmiddelen, wapens, drugs of 18+ materiaal, producten bestemd voor
            doorverkoop en misleidende informatie. De aanbieder is aansprakelijk voor alle
            schade uit een onrechtmatige plaatsing.
          </Section>

          <Section title="Artikel 6, Lotingssysteem en overdracht">
            De loting start na minimaal 4 uur en bij 100 likes of na 24 uur. De winnaar
            wordt willekeurig geselecteerd. Aanbieder en winnaar zijn zelf verantwoordelijk
            voor de feitelijke overdracht. BP Ecom is op geen enkele wijze betrokken bij of
            aansprakelijk voor de overdracht of het nakomen van afspraken.
          </Section>

          <Section title="Artikel 7, Meldingen">
            Ongewenst gedrag kan worden gemeld via info@bpecom.nl of 085 060 1474. BP Ecom
            beslist naar eigen inzicht welke maatregelen worden genomen.
          </Section>

          <Section title="Artikel 8, Uitsluiting van aansprakelijkheid">
            BP Ecom is niet aansprakelijk voor enige directe of indirecte schade voortvloeiend
            uit het gebruik van Droppi, de staat van producten, het niet nakomen van afspraken
            door gebruikers of technische storingen. Gebruikers maken gebruik van Droppi op
            eigen risico. Maximale aansprakelijkheid van BP Ecom bedraagt €0,00 aangezien
            Droppi gratis is.
          </Section>

          <Section title="Artikel 9, Aansprakelijkheid gebruiker">
            De gebruiker is aansprakelijk voor schade door handelen in strijd met deze
            voorwaarden, het verstrekken van onjuiste informatie, onrechtmatig gedrag,
            gevaarlijke plaatsingen of misbruik van het platform. BP Ecom behoudt het recht
            schadevergoeding te vorderen.
          </Section>

          <Section title="Artikel 10, Intellectueel eigendom">
            Alle rechten op naam, logo en content van Droppi berusten bij BP Ecom. Door
            content te plaatsen verleen je BP Ecom een kostenloze licentie voor gebruik op
            het platform.
          </Section>

          <Section title="Artikel 11, Gedragsregels">
            Niet toegestaan: intimidatie, spam, commercieel gebruik van de chat, meerdere
            accounts aanmaken of misbruik van het lotingssysteem.
          </Section>

          <Section title="Artikel 12, Wijzigingen">
            BP Ecom kan deze voorwaarden op elk moment wijzigen. Voortgezet gebruik na
            kennisgeving geldt als aanvaarding.
          </Section>

          <Section title="Artikel 13, Toepasselijk recht">
            Nederlands recht. Geschillen worden voorgelegd aan de bevoegde rechter in het
            arrondissement Oost-Brabant.
          </Section>

          <Text className="text-xs text-muted-foreground mt-4">
            Contact: BP Ecom, Het Kaar 7, 5527 GS Hapert, info@bpecom.nl, 085 060 1474,
            KvK 77270320
          </Text>
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}
