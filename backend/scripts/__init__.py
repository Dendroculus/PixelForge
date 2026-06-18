"""
Administrative and Development Scripts Module.

This package contains standalone CLI utilities for database maintenance, 
usage resets, and developer productivity. Scripts within this module 
are explicitly designed to execute outside the main FastAPI application 
lifecycle.

By requiring direct terminal invocation rather than HTTP exposure, 
these scripts ensure maximum security for destructive operations.
"""