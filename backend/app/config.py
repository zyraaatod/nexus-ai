# NEXUS AI - Configuration
import os
from pathlib import Path
from typing import Optional
from pydantic import BaseSettings

class Settings(BaseSettings):
    # NVIDIA API
    NVIDIA_API_KEY: str = "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"
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    NVIDIA_MODEL: str = "nvidia/nemotron-3.5-bolt-e4b"
    NVIDIA_PROVIDER: str = "nvidia"
    
    # Alternative OpenAI-compatible
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    OPENAI_MODEL: str = ""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Security
    SECRET_KEY: str = "nexus-ai-cybersec-2024-change-in-production"
    SESSION_TIMEOUT: int = 3600
    
    # Shell/Terminal
    SHELL_TIMEOUT: int = 300
    MAX_COMMAND_OUTPUT: int = 50000
    ALLOWED_COMMANDS: str = ""
    
    # Tool Paths (auto-detect if empty)
    NMAP_PATH: str = ""
    MASSCAN_PATH: str = ""
    NIKTO_PATH: str = ""
    SQLMAP_PATH: str = ""
    FFUF_PATH: str = ""
    GOBUSTER_PATH: str = ""
    DIRB_PATH: str = ""
    WHATWEB_PATH: str = ""
    WAFW00F_PATH: str = ""
    SUBFINDER_PATH: str = ""
    AMASS_PATH: str = ""
    ASSETFINDER_PATH: str = ""
    HTTPX_PATH: str = ""
    NUCLEI_PATH: str = ""
    DALFOX_PATH: str = ""
    XSSTRIKE_PATH: str = ""
    COMMIX_PATH: str = ""
    SSH_AUDIT_PATH: str = ""
    TESTSSL_PATH: str = ""
    ENUM4LINUX_PATH: str = ""
    SMB_CLIENT_PATH: str = ""
    LDAPSEARCH_PATH: str = ""
    WHOIS_PATH: str = ""
    DIG_PATH: str = ""
    HOST_PATH: str = ""
    NSLOOKUP_PATH: str = ""
    CURL_PATH: str = ""
    WGET_PATH: str = ""
    PYTHON3_PATH: str = ""
    PERL_PATH: str = ""
    RUBY_PATH: str = ""
    NODE_PATH: str = ""
    PHP_PATH: str = ""
    BASH_PATH: str = ""
    GIT_PATH: str = ""
    JQ_PATH: str = ""
    AWK_PATH: str = ""
    SED_PATH: str = ""
    GREP_PATH: str = ""
    RIPGREP_PATH: str = ""
    FD_PATH: str = ""
    FZF_PATH: str = ""
    BAT_PATH: str = ""
    EXA_PATH: str = ""
    LSD_PATH: str = ""
    DUST_PATH: str = ""
    DUF_PATH: str = ""
    PROCS_PATH: str = ""
    HTOP_PATH: str = ""
    BTOP_PATH: str = ""
    GLANCES_PATH: str = ""
    NETSTAT_PATH: str = ""
    SS_PATH: str = ""
    LSOF_PATH: str = ""
    PS_PATH: str = ""
    TOP_PATH: str = ""
    FREE_PATH: str = ""
    DF_PATH: str = ""
    MOUNT_PATH: str = ""
    LSBLK_PATH: str = ""
    FDISK_PATH: str = ""
    PARTED_PATH: str = ""
    MKFS_PATH: str = ""
    FSCK_PATH: str = ""
    DD_PATH: str = ""
    NC_PATH: str = ""
    NCAT_PATH: str = ""
    SOCAT_PATH: str = ""
    OPENSSL_PATH: str = ""
    GPG_PATH: str = ""
    AGE_PATH: str = ""
    SOPS_PATH: str = ""
    VAULT_PATH: str = ""
    AWS_PATH: str = ""
    AZURE_PATH: str = ""
    GCLOUD_PATH: str = ""
    TERRAFORM_PATH: str = ""
    ANSIBLE_PATH: str = ""
    KUBECTL_PATH: str = ""
    HELM_PATH: str = ""
    ARGOCD_PATH: str = ""
    FLUX_PATH: str = ""
    KUSTOMIZE_PATH: str = ""
    K9S_PATH: str = ""
    STERN_PATH: str = ""
    KUBECTX_PATH: str = ""
    KUBENS_PATH: str = ""
    VELERO_PATH: str = ""
    ISTIOCTL_PATH: str = ""
    LINKERD_PATH: str = ""
    CILIUM_PATH: str = ""
    CALICO_PATH: str = ""
    FLANNEL_PATH: str = ""
    WEAVE_PATH: str = ""
    MULTUS_PATH: str = ""
    WHEREABOUTS_PATH: str = ""
    HOST_LOCAL_PATH: str = ""
    PORTMAP_PATH: str = ""
    BANDWIDTH_PATH: str = ""
    FIREWALL_PATH: str = ""
    SRIOV_PATH: str = ""
    
    # Feature Flags
    ENABLE_TERMINAL: bool = True
    ENABLE_FILE_OPS: bool = True
    ENABLE_NETWORK_TOOLS: bool = True
    ENABLE_WEB_TOOLS: bool = True
    ENABLE_CRYPTO_TOOLS: bool = True
    ENABLE_CLOUD_TOOLS: bool = True
    ENABLE_K8S_TOOLS: bool = True
    
    # Logging
    LOG_FILE: str = "logs/nexus.log"
    LOG_MAX_SIZE: str = "10MB"
    LOG_BACKUP_COUNT: int = 5
    
    # Paths
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    PROMPT_FILE: Path = BASE_DIR / "prompt.txt"
    STORAGE_DIR: Path = BASE_DIR / "storage"
    LOGS_DIR: Path = BASE_DIR / "logs"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Tool command mapping (tool_name -> command)
TOOL_COMMANDS = {
    # Recon
    "subfinder": "subfinder",
    "amass": "amass",
    "assetfinder": "assetfinder",
    "httpx": "httpx",
    "nuclei": "nuclei",
    "whatweb": "whatweb",
    "wafw00f": "wafw00f",
    "katana": "katana",
    "gau": "gau",
    "waybackurls": "waybackurls",
    "paramspider": "paramspider",
    "arjun": "arjun",
    "gospider": "gospider",
    "hakrawler": "hakrawler",
    
    # Scanning
    "nmap": "nmap",
    "masscan": "masscan",
    "naabu": "naabu",
    "rustscan": "rustscan",
    
    # Web Fuzzing
    "ffuf": "ffuf",
    "gobuster": "gobuster",
    "dirb": "dirb",
    "feroxbuster": "feroxbuster",
    
    # Vulnerability
    "nikto": "nikto",
    "sqlmap": "sqlmap",
    "xsstrike": "xsstrike",
    "dalfox": "dalfox",
    "commix": "commix",
    "xssstrike": "xsstrike",
    "xray": "xray",
    
    # Network/AD
    "enum4linux": "enum4linux",
    "crackmapexec": "crackmapexec",
    "kerbrute": "kerbrute",
    "ldapsearch": "ldapsearch",
    "smbclient": "smbclient",
    "rpcclient": "rpcclient",
    "bloodhound": "bloodhound-python",
    
    # Crypto/SSL
    "testssl": "testssl.sh",
    "sslscan": "sslscan",
    "openssl": "openssl",
    
    # Cloud/Containers
    "aws": "aws",
    "azure": "az",
    "gcloud": "gcloud",
    "terraform": "terraform",
    "kubectl": "kubectl",
    "helm": "helm",
    "trivy": "trivy",
    "kube-hunter": "kube-hunter",
    "kube-bench": "kube-bench",
    
    # Post-Exploitation
    "linpeas": "linpeas.sh",
    "winpeas": "winpeas.exe",
    "pspy": "pspy64",
    "linenum": "linenum.sh",
    
    # General
    "curl": "curl",
    "wget": "wget",
    "python3": "python3",
    "python": "python3",
    "perl": "perl",
    "ruby": "ruby",
    "node": "node",
    "php": "php",
    "bash": "bash",
    "sh": "sh",
    "zsh": "zsh",
    "git": "git",
    "jq": "jq",
    "awk": "awk",
    "sed": "sed",
    "grep": "grep",
    "rg": "rg",
    "fd": "fd",
    "fzf": "fzf",
    "bat": "bat",
    "exa": "exa",
    "lsd": "lsd",
    "dust": "dust",
    "duf": "duf",
    "procs": "procs",
    "htop": "htop",
    "btop": "btop",
    "glances": "glances",
    "netstat": "netstat",
    "ss": "ss",
    "lsof": "lsof",
    "ps": "ps",
    "top": "top",
    "free": "free",
    "df": "df",
    "mount": "mount",
    "lsblk": "lsblk",
    "fdisk": "fdisk",
    "parted": "parted",
    "mkfs": "mkfs",
    "fsck": "fsck",
    "dd": "dd",
    "nc": "nc",
    "ncat": "ncat",
    "socat": "socat",
    "gpg": "gpg",
    "age": "age",
    "sops": "sops",
    "vault": "vault",
    "dig": "dig",
    "host": "host",
    "nslookup": "nslookup",
    "whois": "whois",
    "traceroute": "traceroute",
    "mtr": "mtr",
}

def get_tool_path(tool: str) -> str:
    """Get tool path from settings or auto-detect"""
    setting_name = f"{tool.upper()}_PATH"
    if hasattr(settings, setting_name):
        path = getattr(settings, setting_name)
        if path:
            return path
    
    # Auto-detect
    cmd = TOOL_COMMANDS.get(tool, tool)
    import shutil
    found = shutil.which(cmd)
    return found or cmd

def is_tool_allowed(tool: str) -> bool:
    """Check if tool is in allowed list"""
    if not settings.ALLOWED_COMMANDS:
        return True  # Allow all if not configured
    allowed = [c.strip() for c in settings.ALLOWED_COMMANDS.split(",")]
    return tool in allowed
