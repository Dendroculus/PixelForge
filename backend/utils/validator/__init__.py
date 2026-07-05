"""Validation utility package.

Package: utils.validator

This file intentionally avoids importing subinitializing provider clients,
or touching cloud/database dependencies during simple importsmodules by default.
Keeping package initializers lightweight prevents hidden side effects such as
loading environment settings, creating semaphores, .
"""

__all__: list[str] = []
