# HERBARIUM — Direttore Operativo H24

## Scopo
Questo file definisce il comportamento obbligatorio di ogni ciclo autonomo del progetto.

## Regola principale
Mai ricominciare da zero se esiste una base recuperabile. Ogni ciclo parte dall'ultima versione realmente valida e documentata.

## Ciclo obbligatorio
1. Leggi stato reale di `main`, branch candidate, ultimi commit, PR, issue e GitHub Actions.
2. Se esiste un FAIL di CI/test, la missione è SOLO correggere quel FAIL.
3. Se CI è verde, scegli una sola macro-area coerente ad alto impatto.
4. Crea un punto di rollback prima della modifica.
5. Lavora su candidate/branch separata quando la modifica non è banale.
6. Implementa realmente il cambiamento.
7. Esegui test mirati.
8. Esegui regressione pertinente.
9. Se fallisce, correggi e ripeti. Non promuovere.
10. Solo con test realmente verdi puoi proporre/promuovere la candidate.
11. Aggiorna `DIRECTOR_LOG.md` o issue/PR con ciò che è stato realmente fatto.
12. Definisci la missione successiva in base al nuovo stato, non in base a una roadmap astratta.

## Priorità di prodotto
Ordine generale, modificabile solo se emerge un bug/blocco più urgente:
1. Recuperare e versionare nel repo la migliore baseline HERBARIUM reale disponibile.
2. Rendere build/test riproducibili.
3. Riconoscimento prudente: reject/unknown e anti-false-positive.
4. Foto da fotocamera e libreria iPhone.
5. Offline-first reale e privacy locale.
6. Evidence/ProofID e look-alike discrimination.
7. Raccolta/Libro/Atlante senza dati fittizi.
8. UX mobile-first semplice e premium.
9. Accessibilità e robustezza.
10. Academy, esplorazione, mappe e funzioni evolute solo senza indebolire l'affidabilità.

## Vincoli non negoziabili
- Non dichiarare accuracies o percentuali non misurate.
- Non dichiarare test iPhone/Windows/browser reali se non eseguiti.
- Non confermare una specie quando il sistema è incerto.
- Oggetti, animali, stampe, tovaglie e non-piante devono poter finire in UNKNOWN/REJECT.
- Privacy e dati utente locali per impostazione predefinita.
- Nessuna API a pagamento obbligatoria.
- Nessun servizio cloud obbligatorio per le funzioni core.
- Evitare dipendenze inutili.
- Valutare licenza, manutenzione, sicurezza e compatibilità prima di riusare codice GitHub.
- Non usare TinyFish.
- Stable protetta; candidate separata; rollback prima della promozione.

## Una sola macro-missione per ciclo
Non accumulare cinque cambiamenti scollegati nello stesso ciclo. Una macro-area coerente per volta, con test dedicati.

## Definizione di DONE
Una missione è DONE solo se:
- codice/file realmente modificati;
- test pertinenti realmente eseguiti;
- nessuna regressione nota introdotta;
- commit identificabile;
- stato finale documentato;
- prossimo passo scelto sulla base dello stato reale.

## Report orario
Formato breve:
- MISSIONE
- MODIFICA REALE
- COMMIT/BRANCH
- TEST: ✅/❌/⚠️
- BLOCCO RESIDUO
- PROSSIMA MISSIONE

Se non è stato possibile migliorare il progetto, dichiarare il blocco senza inventare progressi.
