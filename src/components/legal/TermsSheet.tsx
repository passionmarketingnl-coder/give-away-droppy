import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsSheet = ({ open, onOpenChange }: TermsSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl px-0">
      <SheetHeader className="px-6 pb-4">
        <SheetTitle className="text-xl font-extrabold">Algemene Voorwaarden</SheetTitle>
      </SheetHeader>
      <ScrollArea className="h-[calc(85vh-80px)] px-6">
        <div className="prose prose-sm max-w-none text-foreground pb-10 space-y-4">
          <p className="text-xs text-muted-foreground font-semibold">Versie 1.1</p>

          <h3 className="text-base font-bold">Artikel 1 — Definities</h3>
          <p>In deze Algemene Voorwaarden worden de volgende begrippen gehanteerd:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>Droppy:</strong> het platform (app en website) waarop gebruikers gratis producten kunnen aanbieden en ontvangen via een lotingssysteem, aangeboden door BP Ecom.</li>
            <li><strong>BP Ecom:</strong> de eigenaar en exploitant van Droppy, gevestigd aan Het Kaar 7, 5527 GS Hapert, KvK 77270320.</li>
            <li><strong>Gebruiker:</strong> iedere natuurlijke persoon die een account aanmaakt en gebruik maakt van Droppy.</li>
            <li><strong>Aanbieder:</strong> een gebruiker die een product plaatst op Droppy.</li>
            <li><strong>Deelnemer:</strong> een gebruiker die via een like meedoet aan een loting.</li>
            <li><strong>Winnaar:</strong> de deelnemer die door het automatische lotingssysteem is geselecteerd.</li>
            <li><strong>Product:</strong> een goed dat gratis wordt aangeboden via Droppy.</li>
            <li><strong>Loting:</strong> het automatische proces waarbij een winnaar wordt aangewezen. De loting vindt plaats na minimaal 4 uur, bij het bereiken van 100 likes en/of na 24 uur — afhankelijk van wat zich het eerst voordoet.</li>
          </ul>

          <h3 className="text-base font-bold">Artikel 2 — Toepasselijkheid</h3>
          <p className="text-sm">Deze Algemene Voorwaarden zijn van toepassing op ieder gebruik van Droppy. Door een account aan te maken verklaar je deze voorwaarden te hebben gelezen en te aanvaarden. Het aanmaken van een account impliceert dat je aansprakelijk kunt worden gesteld voor schade veroorzaakt door handelen in strijd met deze voorwaarden.</p>

          <h3 className="text-base font-bold">Artikel 3 — Het platform</h3>
          <p className="text-sm">Droppy is een gratis platform voor het lokaal weggeven van producten binnen 7 km. Droppy treedt uitsluitend op als technisch tussenpersoon en is geen partij in de overdracht van producten. BP Ecom behoudt het recht het platform te wijzigen of te beëindigen zonder voorafgaande kennisgeving.</p>

          <h3 className="text-base font-bold">Artikel 4 — Account en registratie</h3>
          <p className="text-sm">Je dient minimaal 18 jaar oud te zijn, correcte gegevens te verstrekken en je inloggegevens vertrouwelijk te houden. Door registratie ga je een overeenkomst aan met BP Ecom en accepteer je dat BP Ecom je aansprakelijk kan stellen voor schade die voortvloeit uit handelen in strijd met deze voorwaarden of uit het verstrekken van onjuiste gegevens.</p>

          <h3 className="text-base font-bold">Artikel 5 — Plaatsen van producten</h3>
          <p className="text-sm">De aanbieder is volledig verantwoordelijk voor geplaatste producten. Verboden zijn: illegale, gevaarlijke of schadelijke producten; levende dieren, voedsel, geneesmiddelen, wapens, drugs of 18+ materiaal; producten bestemd voor doorverkoop; misleidende informatie. De aanbieder is aansprakelijk voor alle schade die voortvloeit uit een onrechtmatige plaatsing.</p>

          <h3 className="text-base font-bold">Artikel 6 — Lotingssysteem en overdracht</h3>
          <p className="text-sm">De loting start na minimaal 4 uur én bij 100 likes of na 24 uur. De winnaar wordt willekeurig geselecteerd. Aanbieder en winnaar zijn zelf verantwoordelijk voor de feitelijke overdracht. BP Ecom is op geen enkele wijze betrokken bij of aansprakelijk voor de overdracht of het nakomen van afspraken.</p>

          <h3 className="text-base font-bold">Artikel 7 — Meldingen</h3>
          <p className="text-sm">Ongewenst gedrag kan worden gemeld via info@bpecom.nl of 085 060 1474. BP Ecom beslist naar eigen inzicht welke maatregelen worden genomen.</p>

          <h3 className="text-base font-bold">Artikel 8 — Uitsluiting van aansprakelijkheid</h3>
          <p className="text-sm">BP Ecom is niet aansprakelijk voor enige directe of indirecte schade voortvloeiend uit het gebruik van Droppy, de staat van producten, het niet nakomen van afspraken door gebruikers, of technische storingen. Gebruikers maken gebruik van Droppy volledig op eigen risico. De maximale aansprakelijkheid van BP Ecom bedraagt €0,00 aangezien Droppy gratis is.</p>

          <h3 className="text-base font-bold">Artikel 9 — Aansprakelijkheid gebruiker</h3>
          <p className="text-sm">De gebruiker is aansprakelijk voor schade door handelen in strijd met deze voorwaarden, het verstrekken van onjuiste informatie, onrechtmatig gedrag, gevaarlijke plaatsingen of misbruik van het platform. BP Ecom behoudt het recht schadevergoeding te vorderen.</p>

          <h3 className="text-base font-bold">Artikel 10 — Intellectueel eigendom</h3>
          <p className="text-sm">Alle rechten op naam, logo en content van Droppy berusten bij BP Ecom. Door content te plaatsen verleen je BP Ecom een kostenloze licentie voor gebruik op het platform.</p>

          <h3 className="text-base font-bold">Artikel 11 — Gedragsregels</h3>
          <p className="text-sm">Niet toegestaan: intimidatie, spam, commercieel gebruik van de chat, meerdere accounts aanmaken of misbruik van het lotingssysteem.</p>

          <h3 className="text-base font-bold">Artikel 12 — Wijzigingen</h3>
          <p className="text-sm">BP Ecom kan deze voorwaarden op elk moment wijzigen. Voortgezet gebruik na kennisgeving geldt als aanvaarding.</p>

          <h3 className="text-base font-bold">Artikel 13 — Toepasselijk recht</h3>
          <p className="text-sm">Nederlands recht. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement Oost-Brabant.</p>

          <p className="text-xs text-muted-foreground mt-6">Contact: BP Ecom | Het Kaar 7, 5527 GS Hapert | info@bpecom.nl | 085 060 1474 | KvK 77270320</p>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
);

export default TermsSheet;
