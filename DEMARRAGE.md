# Démarrage de Kairos

## Option 1 — Docker (recommandé)

```bash
cd dca-tracker
docker-compose up
```

Frontend : http://localhost:5173  
Backend  : http://localhost:8000

---

## Option 2 — Manuel (sans Docker)

### Prérequis
- Python 3.12+
- Node.js 20+
- PostgreSQL en local (port 5432)

### 1. Base de données

Créer la base dans PostgreSQL :
```sql
CREATE DATABASE dca_tracker;
```

### 2. Backend

```bash
cd dca-tracker/backend

python -m venv .venv
source .venv/bin/activate       # Mac/Linux
# .venv\Scripts\activate        # Windows

pip install -r requirements.txt
```

Créer le fichier `.env` (copier depuis `.env.example`) :
```bash
cp ../.env.example .env
```

Éditer `.env` et remplacer `db` par `localhost` dans `DATABASE_URL` :
```
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/dca_tracker
```

Lancer les migrations :
```bash
alembic upgrade head
```

Démarrer le backend :
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

Dans un nouveau terminal :
```bash
cd dca-tracker/frontend

npm install
npm run dev
```

Frontend : http://localhost:5173

---

## Relancer après un arrêt

### Docker
```bash
docker-compose up
```

### Manuel
```bash
# Terminal 1
cd dca-tracker/backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2
cd dca-tracker/frontend && npm run dev
```

---

## Import Trade Republic

Lance Kairos d'abord, puis dans un terminal séparé :

```bash
cd dca-tracker

# Créer un env virtuel dédié au script (une seule fois)
python -m venv .venv_scripts
source .venv_scripts/bin/activate
pip install pytr requests

# Lancer l'import
python scripts/import_tr.py
```

Le script demande :
1. Ton numéro de téléphone TR (format `+33612345678`)
2. Ton PIN TR (4 chiffres)
3. Le code OTP reçu dans l'app TR

Si un ticker n'est pas reconnu automatiquement, ajoute le mapping dans
`scripts/import_tr.py` dans le dictionnaire `ISIN_TO_TICKER`.

---

## Tests

```bash
cd dca-tracker/backend
source .venv/bin/activate
pytest -v
```
