"""Shared AI job routes for initialization, polling, and usage status.

Package: api.routes.jobs

This file intentionally avoids importing submodules by default.
Keeping package initializers lightweight prevents hidden side effects such as
loading environment settings, creating semaphores, initializing provider clients,
or touching cloud/database dependencies during simple imports.
"""

__all__: list[str] = []
