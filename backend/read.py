from pathlib import Path


def get_env_keys(env_path: str = ".env") -> list[str]:
    keys: list[str] = []

    for line in Path(env_path).read_text(encoding="utf-8").splitlines():
        line = line.strip()

        # Ignore blank lines and comments
        if not line or line.startswith("#"):
            continue

        # Support lines beginning with "export"
        if line.startswith("export "):
            line = line[7:].strip()

        if "=" in line:
            key = line.split("=", 1)[0].strip()

            if key:
                keys.append(key)

    return keys


for env_key in get_env_keys():
    print(env_key)