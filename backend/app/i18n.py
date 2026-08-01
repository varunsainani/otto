"""Backend message catalog. Locale resolved from the X-Locale header, then
Accept-Language, defaulting to English. Keys mirror what the API can return so the
client shows a localized message even for server-side errors."""
from fastapi import Request

SUPPORTED = ("en", "es", "pt")
DEFAULT = "en"

MESSAGES: dict[str, dict[str, str]] = {
    "invalid_credentials": {
        "en": "Invalid email or password.",
        "es": "Correo o contrasena invalidos.",
        "pt": "E-mail ou senha invalidos.",
    },
    "email_taken": {
        "en": "That email is already registered.",
        "es": "Ese correo ya esta registrado.",
        "pt": "Esse e-mail ja esta cadastrado.",
    },
    "not_authenticated": {
        "en": "Please sign in to continue.",
        "es": "Inicia sesion para continuar.",
        "pt": "Faca login para continuar.",
    },
    "forbidden": {
        "en": "You do not have access to this.",
        "es": "No tienes acceso a esto.",
        "pt": "Voce nao tem acesso a isto.",
    },
    "not_found": {
        "en": "Not found.",
        "es": "No encontrado.",
        "pt": "Nao encontrado.",
    },
    "run_not_found": {
        "en": "Run not found.",
        "es": "Ejecucion no encontrada.",
        "pt": "Execucao nao encontrada.",
    },
    "daily_limit_reached": {
        "en": "You have reached the daily run limit for this demo. Try again tomorrow.",
        "es": "Alcanzaste el limite diario de ejecuciones de esta demo. Intenta manana.",
        "pt": "Voce atingiu o limite diario de execucoes desta demo. Tente amanha.",
    },
    "goal_required": {
        "en": "Describe what you want Otto to do.",
        "es": "Describe lo que quieres que Otto haga.",
        "pt": "Descreva o que voce quer que o Otto faca.",
    },
    "llm_unavailable": {
        "en": "The agent is temporarily unavailable. Please try again.",
        "es": "El agente no esta disponible temporalmente. Intenta de nuevo.",
        "pt": "O agente esta temporariamente indisponivel. Tente novamente.",
    },
}


def resolve_locale(request: Request) -> str:
    header = (request.headers.get("x-locale") or "").lower().strip()
    if header in SUPPORTED:
        return header
    accept = (request.headers.get("accept-language") or "").lower()
    for part in accept.split(","):
        code = part.split(";")[0].strip()[:2]
        if code in SUPPORTED:
            return code
    return DEFAULT


def t(key: str, locale: str = DEFAULT) -> str:
    entry = MESSAGES.get(key)
    if not entry:
        return key
    return entry.get(locale) or entry.get(DEFAULT) or key
