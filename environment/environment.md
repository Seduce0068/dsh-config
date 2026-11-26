## OS / Kernel
Ubuntu 26.04.1 LTS
kernel: 7.0.0-43-generic
arch: x86_64

## Hardware

total        used        free      shared  buff/cache   available
Mem:         <memory>     <used>     <free>     <shared>    <cache>     <available>
Swap:        <swap>       <used>     <free>
GPU: <gpu>（driver <driver>, VRAM <vram>）

## Versions
dsh: 0.2.2-rc.1
node: v24.22.2
pnpm: 12.18.0
rustc: rustc 1.99.1 (58cf8f9c3 2026-10-13)
cargo: cargo 1.99.1 (5f94df478 2026-08-27)
python3: Python 3.14.4
tailscale: 1.104.5
git: git version 2.53.0

## Storage（sanitized）
NAME          SIZE    FSTYPE  MOUNTPOINT
<disk>        <size>
└─<diskpart>  <size>  <fstype>
<disk>        <size>
└─<diskpart>  <size>  ext4    <mount>
<disk>        <size>
├─<diskpart>  <size>  ntfs
├─<diskpart>  <size>  vfat    <mount>
├─<diskpart>  <size>
├─<diskpart>  <size>  ntfs
├─<diskpart>  <size>  ntfs
└─<diskpart>  <size>  ext4    <mount>
Filesystem      Size    Used  Avail Use% Mounted on
<diskpart>      <size>  <used> <avail> <pct>% <mount>
<diskpart>      <size>  <used> <avail> <pct>% <mount>

## Network (sanitized)
default via <private-ip> dev <iface> proto dhcp src <private-ip> metric 100
<private-ip>/24 dev <iface> proto kernel scope link src <private-ip> linkdown
<private-ip>/16 dev <iface> proto kernel scope link src <private-ip> linkdown
<private-ip>/16 dev <iface> proto kernel scope link src <private-ip> linkdown
<private-ip>/16 dev <iface> proto kernel scope link src <private-ip> linkdown
State  Recv-Q Send-Q                          Local Address:Port  Peer Address:PortProcess
LISTEN 0      128                                 203.0.113.2:50052      203.0.113.3:*    users:(("jarvis-mcp-gw",pid=<pid>,fd=9))
LISTEN 0      128                                 203.0.113.4:50053      203.0.113.5:*    users:(("jarvis-event",pid=<pid>,fd=11))
LISTEN 0      128                                 203.0.113.6:50054      203.0.113.7:*    users:(("jarvis-context",pid=<pid>,fd=11))
LISTEN 0      128                                 203.0.113.8:50051      203.0.113.9:*    users:(("jarvis-policy",pid=<pid>,fd=9))
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:8443       203.0.113.10:*
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:8445       203.0.113.11:*
LISTEN 0      512                                 203.0.113.12:49374      203.0.113.13:*    users:(("opencode",pid=<pid>,fd=8))
LISTEN 0      512                                 203.0.113.14:49375      203.0.113.15:*    users:(("opencode",pid=<pid>,fd=8))
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:42914      203.0.113.16:*
LISTEN 0      4096                                203.0.113.17:18888      203.0.113.18:*    users:(("caddy",pid=<pid>,fd=8))
LISTEN 0      4096                                203.0.113.19:18889      203.0.113.20:*    users:(("caddy",pid=<pid>,fd=4))
LISTEN 0      4096                                203.0.113.21:18890      203.0.113.22:*    users:(("caddy",pid=<pid>,fd=7))
LISTEN 0      511                                 203.0.113.23:18789      203.0.113.24:*    users:(("MainThread",pid=<pid>,fd=27))
LISTEN 0      4096                                203.0.113.25:18554      203.0.113.26:*
LISTEN 0      32                              <private-ip>:53         203.0.113.27:*
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:443        203.0.113.28:*
LISTEN 0      4096                                203.0.113.29:53         203.0.113.30:*
LISTEN 0      4096                                203.0.113.31:631        203.0.113.32:*
LISTEN 0      4096                            203.0.113.33%lo:53         203.0.113.34:*
LISTEN 0      511                                 203.0.113.35:32973      203.0.113.36:*    users:(("code",pid=<pid>,fd=62))
LISTEN 0      511                                 203.0.113.37:34671      203.0.113.38:*    users:(("code",pid=<pid>,fd=42))
LISTEN 0      4096                                203.0.113.39:34063      203.0.113.40:*
LISTEN 0      5                                   203.0.113.41:1081       203.0.113.42:*    users:(("adguard-cli",pid=<pid>,fd=73))
LISTEN 0      511                                 203.0.113.43:36391      203.0.113.44:*    users:(("code",pid=<pid>,fd=54))
