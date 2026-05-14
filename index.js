// supa lit index.js

const express = require('express');
const bodyParser = require('body-parser');
const supabaseClient = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const app = express();
const port = 3000;
dotenv.config();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseClient.createClient(supabaseUrl, supabaseKey);

// Pre-requisite functions:

// Function to get a date from x days in the past:
function getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('.')[0] + '.000';
}

// Function to grab metrics from the CVE (why are there so many damn versions pmo):
function getMetrics(cve) {
    if (cve.metrics?.cvssMetricV40?.[0]?.cvssData) {
        return cve.metrics.cvssMetricV40[0].cvssData;
    }
    if (cve.metrics?.cvssMetricV31?.[0]?.cvssData) {
        return cve.metrics.cvssMetricV31[0].cvssData;
    }
    if (cve.metrics?.cvssMetricV2?.[0]?.cvssData) {
        return cve.metrics.cvssMetricV2[0].cvssData;
    }
    return {};
}

// Grab specific CVE by their ID:
app.get('/api/cves/:id', async (req, res) => {
    const cveId = req.params.id;
    console.log(`Getting CVE: ${cveId}`);
    const { data, error } = await supabase
        .from('cves')
        .select()
        .eq('id', cveId)
        .single();
    if (error) {
        res.statusCode = 500;
        res.send(error);
    } else {
        res.json(data);
    }
});

// Grab CVEs from DB:
app.get('/api/cves', async (req, res) => {
    // Read whatever optional parameters were passed in:
    const { keyword, severity, days } = req.query;

    console.log('Fetching CVEs...', req.query);

    // Construct the base query before parameters:
    let query = supabase.from('cves').select().range(0, 1999);

    // Only add filter if it was actually provided by query:
    if (severity && severity !== 'all') {
        query = query.eq('severity', severity.toUpperCase());
    }

    if (keyword) {
        query = query.ilike('description', `%${keyword}%`);
    }

    if (days && days !== 'all') {
        const startDate = getDateString(parseInt(days));
        query = query.gte('published', startDate);
    }

    // Execute da final query:
    const { data, error } = await query;

    if (error) {
        res.statusCode = 500;
        res.send(error);
    } else {
        res.json(data);
    }
});

// Sync NVD API with internal database; updates & populates CVE events into DB so they are the most recent:
app.get('/api/sync', async (req, res) => {
    console.log('Syncing from NVD...');

    const startDate = getDateString(120);
    const endDate = getDateString(0);

    const response = await fetch(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=2000&pubStartDate=${startDate}&pubEndDate=${endDate}`,
        {
            headers: {
                'apiKey': process.env.NVD_API_KEY
            }
        }
    );
    
    const nvdData = await response.json().catch(() => null);

    if (!nvdData || !nvdData.vulnerabilities) {
        res.statusCode = 500;
        res.json({ message: 'Failed to fetch from NVD, possibly rate limited. Try again later.' });
        return;
    }

    const cves = nvdData.vulnerabilities
    .filter(item => item.cve.vulnStatus !== 'Rejected')
    .map((item) => {
        const cve = item.cve;
        const metrics = getMetrics(cve);
        return {
            id: cve.id,
            published: cve.published,
            last_modified: cve.lastModified,
            severity: metrics.baseSeverity || null,
            base_score: metrics.baseScore || null,
            description: cve.descriptions?.find(d => d.lang === 'en')?.value || null,
            attack_vector: metrics.attackVector || null,
        };
    });

    const { error } = await supabase
        .from('cves')
        .upsert(cves, { onConflict: 'id' });

    if (error) {
        res.statusCode = 500;
        res.send(error);
    } else {
        res.json({ message: `Synced ${cves.length} CVEs successfully` });
    }
});


// Counts for severity summary card:
app.get('/api/summary', async (req, res) => {
    console.log('Fetching summary card data...');

    const [critical, high, medium, low] = await Promise.all([
        supabase.from('cves').select('*', { count: 'exact', head: true }).eq('severity', 'CRITICAL'),
        supabase.from('cves').select('*', { count: 'exact', head: true }).eq('severity', 'HIGH'),
        supabase.from('cves').select('*', { count: 'exact', head: true }).eq('severity', 'MEDIUM'),
        supabase.from('cves').select('*', { count: 'exact', head: true }).eq('severity', 'LOW'),
    ]);

    res.json({
        critical: critical.count,
        high: high.count,
        medium: medium.count,
        low: low.count,
    });
});

// Function to retrieve attack vector chart data:
app.get('/api/attack-vectors', async (req, res) => {
    console.log('Fetching attack vector data...');

    const { data, error } = await supabase
        .from('cves')
        .select('attack_vector');

    if (error) {
        res.statusCode = 500;
        res.send(error);
        return;
    }

    const vectors = {};
    data.forEach(cve => {
        const key = cve.attack_vector || 'Unknown';
        if (vectors[key] === undefined) {
            vectors[key] = 1;
        } else {
            vectors[key] = vectors[key] + 1;
        }
    });

    res.json(vectors);
});

app.listen(port, () => {
    console.log(`App is available on port: ${port}`);
});