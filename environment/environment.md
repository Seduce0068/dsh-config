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
default via <private-ip> dev enp4s0 proto dhcp src <private-ip> metric 100
<private-ip>/24 dev lxcbr0 proto kernel scope link src <private-ip> linkdown
<private-ip>/16 dev docker0 proto kernel scope link src <private-ip> linkdown
<private-ip>/16 dev <bridge-id> proto kernel scope link src <private-ip> linkdown
<private-ip>/16 dev <bridge-id> proto kernel scope link src <private-ip> linkdown
State  Recv-Q Send-Q                          Local Address:Port  Peer Address:PortProcess
LISTEN 0      128                                 127.0.0.1:50052      0.0.0.0:*    users:(("jarvis-mcp-gw",pid=<pid>,fd=9))
LISTEN 0      128                                 127.0.0.1:50053      0.0.0.0:*    users:(("jarvis-event",pid=<pid>,fd=11))
LISTEN 0      128                                 127.0.0.1:50054      0.0.0.0:*    users:(("jarvis-context",pid=<pid>,fd=11))
LISTEN 0      128                                 127.0.0.1:50051      0.0.0.0:*    users:(("jarvis-policy",pid=<pid>,fd=9))
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:8443       0.0.0.0:*
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:8445       0.0.0.0:*
LISTEN 0      512                                 127.0.0.1:49374      0.0.0.0:*    users:(("opencode",pid=<pid>,fd=8))
LISTEN 0      512                                 127.0.0.1:49375      0.0.0.0:*    users:(("opencode",pid=<pid>,fd=8))
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:42914      0.0.0.0:*
LISTEN 0      4096                                127.0.0.1:18888      0.0.0.0:*    users:(("caddy",pid=<pid>,fd=8))
LISTEN 0      4096                                127.0.0.1:18889      0.0.0.0:*    users:(("caddy",pid=<pid>,fd=4))
LISTEN 0      4096                                127.0.0.1:18890      0.0.0.0:*    users:(("caddy",pid=<pid>,fd=7))
LISTEN 0      511                                 127.0.0.1:18789      0.0.0.0:*    users:(("MainThread",pid=<pid>,fd=27))
LISTEN 0      4096                                127.0.0.1:18554      0.0.0.0:*
LISTEN 0      32                              <private-ip>:53         0.0.0.0:*
LISTEN 0      4096                 <TAILNET_IP>%tailscale0:443        0.0.0.0:*
LISTEN 0      4096                                127.0.0.54:53         0.0.0.0:*
LISTEN 0      4096                                127.0.0.1:631        0.0.0.0:*
LISTEN 0      4096                            127.0.0.53%lo:53         0.0.0.0:*
LISTEN 0      511                                 127.0.0.1:32973      0.0.0.0:*    users:(("code",pid=<pid>,fd=62))
LISTEN 0      511                                 127.0.0.1:34671      0.0.0.0:*    users:(("code",pid=<pid>,fd=42))
LISTEN 0      4096                                127.0.0.1:34063      0.0.0.0:*
LISTEN 0      5                                   127.0.0.1:1081       0.0.0.0:*    users:(("adguard-cli",pid=<pid>,fd=73))
LISTEN 0      511                                 127.0.0.1:36391      0.0.0.0:*    users:(("code",pid=<pid>,fd=54))
