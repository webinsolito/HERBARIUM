# HERBARIUM — The Living Atlas

Repository operativo del progetto HERBARIUM.

## Missione
HERBARIUM è un prodotto mobile-first pensato soprattutto per iPhone: riconoscimento prudente delle piante, raccolta personale, atlante, Academy, libro/erbario e funzioni offline-first con privacy locale.

Principi non negoziabili:
- niente conferme forzate quando l'evidenza è insufficiente;
- reject/unknown per foto non vegetali o casi dubbi;
- privacy-first e funzionamento il più possibile offline;
- niente API a pagamento obbligatorie;
- nessuna regressione delle funzioni già validate;
- test reali prima di dichiarare PASS;
- stable protetta, candidate separata e rollback sempre possibile.

## Stato recuperato
Il progetto precedente ha raggiunto una baseline pubblicata v0.5 con 53/53 test dichiarati nel TestLab e una candidate 0.6 in evoluzione. La repository `webinsolito/HERBARIUM` è stata inizializzata il 19 settembre 2026 come nuovo punto operativo.

Live reference:
https://herbarium-taccuino-zero.jorrob98.chatgpt.site

## Modalità H24
Il progetto usa due livelli:
1. **Direttore operativo orario**: controlla repository, commit, Actions, errori, backlog e sceglie una sola macro-missione coerente per ciclo.
2. **GitHub CI/guardrail**: valida automaticamente ogni modifica e riesegue controlli periodici.

Ogni ciclo deve partire dall'ultima base realmente valida, creare rollback/candidate, implementare una sola area coerente, testare, correggere i FAIL e solo dopo promuovere.

Vedi:
- `DIRECTOR.md`
- `ROADMAP.md`
- `RECOVERY.md`
