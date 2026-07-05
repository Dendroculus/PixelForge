"""Job initialization, queueing, dispatching, and execution package.

Package: services.job

This file intentionally avoids importing submodules by default.
Keeping package initializers lightweight prevents hidden side effects such as
loading environment settings, creating semaphores, initializing provider clients,
or touching cloud/database dependencies during simple imports.
"""

__all__: list[str] = []
