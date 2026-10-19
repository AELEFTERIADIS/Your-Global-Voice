"""CI-only installation of the immutable Debian browser used by visual baselines.

Current Debian mirrors drop old browser versions. Snapshot's versioned binary API
and content-addressed files preserve this exact rendering environment instead.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.request

VERSION = '154.0.8037.57-1~deb13u1'
ARCHIVE = 'https://snapshot.debian.org'
if os.environ.get('CI') != 'true' or os.geteuid() != 0:
    raise SystemExit('Run only in the disposable root CI test container.')

with tempfile.TemporaryDirectory(prefix='ygv-visual-browser-') as directory:
    packages = []
    for binary in ['chromium-common', 'chromium']:
        with urllib.request.urlopen(f'{ARCHIVE}/mr/binary/{binary}/{VERSION}/binfiles', timeout=30) as response:
            metadata = json.load(response)
        matches = [entry['hash'] for entry in metadata['result'] if entry['architecture'] == 'amd64']
        if len(matches) != 1:
            raise SystemExit(f'Expected one immutable amd64 archive file for {binary} {VERSION}.')
        digest = matches[0]
        with urllib.request.urlopen(f'{ARCHIVE}/file/{digest}', timeout=120) as response:
            data = response.read()
        if hashlib.sha1(data).hexdigest() != digest:
            raise SystemExit(f'Archive content-address mismatch for {binary}.')
        package = Path(directory) / f'{binary}.deb'
        package.write_bytes(data)
        actual = subprocess.check_output(['dpkg-deb', '-f', str(package), 'Version'], text=True).strip()
        if actual != VERSION:
            raise SystemExit(f'Wrong archived version for {binary}: {actual}')
        print(f'{binary} {VERSION} SHA256 {hashlib.sha256(data).hexdigest()}', flush=True)
        packages.append(str(package))
    subprocess.run(['apt-get', 'install', '-y', '--no-install-recommends', *packages], check=True)
    actual = subprocess.check_output(['dpkg-query', '-W', '-f=${Version}', 'chromium'], text=True)
    if actual != VERSION:
        raise SystemExit('Installed browser differs from visual baseline version.')
