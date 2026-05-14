# Is It Critical?

## Description

Is It Critical? is a cybersecurity vulnerability dashboard built on top of NIST's
National Vulnerability Database (NVD). The goal of this app is to make CVE
(Common Vulnerabilities and Exposures) data more accessible and readable for
people who are curious about cybersecurity trends but don't want to dig through
raw API responses. You can search and filter vulnerabilities, view severity
breakdowns, and click into individual CVEs for more detail.

Data is pulled from the NVD API and stored in a Supabase database so the
dashboard doesn't have to hit the NVD every time someone loads the page.

## Target Browsers

This app is built for desktop browsers. It works best on:

- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge

It wasn't really designed for mobile but Bootstrap makes it mostly usable on
smaller screens anyway (hopefully).

## Link to Developer Manual

See the [Developer Manual](docs/README.md).

