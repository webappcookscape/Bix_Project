const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://cs_db_gtz9_user:Y38JbWPROuC9AL0ftUDemnvxQa3GXHkS@dpg-d5ag56ili9vc73b5u3ag-a.virginia-postgres.render.com/cs_db_gtz9?sslmode=require",
});

async function testConnection() {
    try {
        console.log("Connecting using pg...");
        await client.connect();
        console.log("Connected successfully!");
        const res = await client.query('SELECT NOW()');
        console.log("Time from DB:", res.rows[0]);
    } catch (err) {
        console.error("Connection error using pg:", err.message);
        if (err.code) console.error("Error code:", err.code);
    } finally {
        await client.end();
    }
}

testConnection();
