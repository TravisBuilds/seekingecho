import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import { parse } from 'csv-parse'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 5) + '...')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SightingRecord {
  Date: string
  'IDs/Matrilines': string
  'Min. Group Size': string
  'First Sighting Location': string
  'First Sighting Latitude': string
  'First Sighting Longitude': string
  'First Sighting Time': string
  'First Sighting Direction': string
  'End Sighting Location': string
  'End Sighting Latitude': string
  'End Sighting Longitude': string
  'End Sighting Time': string
  'End Sighting Direction': string
}

async function importSightings() {
  const years = ['2020', '2021', '2022', '2023', '2024']
  
  for (const year of years) {
    const filePath = path.join(process.cwd(), 'public', 'data', 'sightings', 'yearly', `${year}.csv`)
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const records: SightingRecord[] = await new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) reject(err)
        else resolve(records)
      })
    })

    for (const record of records) {
      // First, create or get whale records
      const whaleIds = record['IDs/Matrilines'].split(',').map(id => id.trim())
      const whaleRecords = await Promise.all(
        whaleIds.map(async (matrilineId) => {
          // Skip empty or placeholder IDs
          if (!matrilineId || matrilineId === '?' || matrilineId.includes('(')) return null

          const { data: existing } = await supabase
            .from('whales')
            .select()
            .eq('matriline_id', matrilineId)
            .single()

          if (existing) return existing

          const { data: newWhale } = await supabase
            .from('whales')
            .insert({ matriline_id: matrilineId })
            .select()
            .single()

          return newWhale
        })
      )

      // Create the sighting record
      const { data: sighting } = await supabase
        .from('sightings')
        .insert({
          date: record.Date,
          min_group_size: parseInt(record['Min. Group Size']),
          first_sighting_location: record['First Sighting Location'],
          first_sighting_latitude: parseFloat(record['First Sighting Latitude']),
          first_sighting_longitude: parseFloat(record['First Sighting Longitude']),
          first_sighting_time: record['First Sighting Time'],
          first_sighting_direction: record['First Sighting Direction'],
          end_sighting_location: record['End Sighting Location'],
          end_sighting_latitude: parseFloat(record['End Sighting Latitude']),
          end_sighting_longitude: parseFloat(record['End Sighting Longitude']),
          end_sighting_time: record['End Sighting Time'],
          end_sighting_direction: record['End Sighting Direction']
        })
        .select()
        .single()

      // Create the relationships between sightings and whales
      if (sighting) {
        await Promise.all(
          whaleRecords
            .filter((whale): whale is NonNullable<typeof whale> => whale !== null)
            .map(whale =>
              supabase
                .from('sighting_whales')
                .insert({
                  sighting_id: sighting.id,
                  whale_id: whale.id
                })
            )
        )
      }
    }
    
    console.log(`Imported data for year ${year}`)
  }
}

importSightings()
  .then(() => console.log('Import completed successfully'))
  .catch(error => console.error('Import failed:', error)) 