-- Get Company Stats via RPC to resolve Frontend N+1 Performance Issue
CREATE OR REPLACE FUNCTION get_company_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
WITH base_data AS (
    SELECT 
        store_count,
        plan,
        risk_score,
        CASE 
            WHEN status = '등록됨' THEN 'pending'
            WHEN status = '분석중' THEN 'crawling'
            WHEN status = '분석완료' THEN 'analyzed'
            ELSE COALESCE(status, 'pending')
        END AS st
    FROM companies
),
raw_data AS (
    SELECT * FROM base_data
    WHERE st NOT IN ('rejected', 'invalid_site', 'no_homepage', 'promo_only', 'no_policy')
),
status_agg AS (
    SELECT st, count(*) as c FROM base_data GROUP BY st
),
status_json AS (
    SELECT json_object_agg(st, c) as counts FROM status_agg
)
SELECT json_build_object(
    'total', (SELECT count(*) FROM raw_data),
    'subscribers', (SELECT count(*) FROM raw_data WHERE plan IS NOT NULL AND plan != 'none'),
    'premium', (SELECT count(*) FROM raw_data WHERE plan = 'premium'),
    'standard', (SELECT count(*) FROM raw_data WHERE plan = 'standard'),
    'starter', (SELECT count(*) FROM raw_data WHERE plan = 'starter'),
    'atRisk', (SELECT count(*) FROM raw_data WHERE 100 - COALESCE(risk_score, 0) < 50),
    'totalStores', COALESCE((SELECT sum(store_count) FROM raw_data), 0),
    'unreviewedIssues', 0,
    'reviewedIssues', 0,
    'statusCounts', COALESCE((SELECT counts FROM status_json), '{}'::json)
);
$$;
