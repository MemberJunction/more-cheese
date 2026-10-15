/**
 * scripts/align-planted-duplicates.mjs — make the planted duplicate people look like duplicates (#117)
 *
 * More Cheese plants duplicate people for the duplicate-detection demo. Each one carries a
 * `DuplicatePerson` data quality label: `PersonID` is the duplicate, `RelatedPersonID` the original.
 * generate.mjs runs the declarative name and DOB generators over every person, planted duplicates
 * included, so each duplicate came out with its own first name and birth date. In the committed
 * tree none of the 25 pairs shared a first name or birth date, and duplicate detection and the LLM
 * review correctly rejected all of them — the demo had no duplicates to find.
 *
 * This pass runs after those generators and copies the identity fields from the original onto the
 * duplicate. It never edits the original and never adds, drops or re-keys a record (the base-delta
 * check in check-metadata-closure.mjs rejects that); it only changes field values.
 *
 * ── RULE 1 — names and birth date ──
 * FirstName, MiddleName, LastName and DateOfBirth are copied, except a name the duplicate's hero
 * entry fixes (Kathy OLeary keeps her nickname and spelling; heroes.json says so). Email and the
 * employer stay the duplicate's own — those are what make it a realistic duplicate.
 *
 * ── RULE 2 — phone, with its contact row ──
 * In the tree, every person's Phone is also their primary phone contact method row. So the phone is
 * copied only when both people have one, and the duplicate's primary phone row that held the old
 * number takes the new one. When either side has no phone, aligning it would mean adding or dropping
 * a contact row, so the phone is left as it is.
 *
 * ── RULE 3 — the label names the duplicate as it now reads ──
 * A label's DefectValue is "<FirstName> <LastName> (<code>)", written when the duplicate was
 * planted, so after rule 1 it named someone who no longer exists. The name part is rewritten from
 * the duplicate's aligned fields; the code in brackets stays. A DefectValue in any other shape
 * fails loudly rather than being guessed at.
 */

const IDENTITY_FIELDS = ['FirstName', 'MiddleName', 'LastName', 'DateOfBirth'];

const DEFECT_VALUE_SHAPE = /^.+ (\([^()]+\))$/;

const isPhoneType = (contactTypeId) => /Phone$/.test(String(contactTypeId || ''));

/**
 * Align every planted duplicate with its original, in place.
 *
 * @param {object} args
 * @param {Array<{fields: object, primaryKey: {ID: string}}>} args.people        generated/people rows
 * @param {Array<{fields: object, primaryKey: {ID: string}}>} args.contactMethods generated/contact-methods rows
 * @param {Array<{fields: object}>} args.labels                                  generated/data-quality-labels rows
 * @param {Map<string, object>} [args.heroFixedFieldsByEmail]                    lower-cased email → hero fixedFields
 * @returns {{ pairs: number, fieldsChanged: number, phonesAligned: number, labelsRenamed: number }}
 */
export function alignPlantedDuplicates({ people, contactMethods, labels, heroFixedFieldsByEmail = new Map() }) {
    const personById = new Map(people.map((p) => [p.primaryKey.ID.toLowerCase(), p.fields]));
    const find = (id, role, label) => {
        const fields = personById.get(String(id || '').toLowerCase());
        if (!fields) throw new Error(`DuplicatePerson label ${label.LabelKey || ''} names a missing ${role} person ${id}`);
        return fields;
    };

    const stats = { pairs: 0, fieldsChanged: 0, phonesAligned: 0, labelsRenamed: 0 };
    for (const { fields: label } of labels) {
        if (label.DefectKind !== 'DuplicatePerson') continue;
        const dup = find(label.PersonID, 'duplicate', label);
        const orig = find(label.RelatedPersonID, 'original', label);
        const fixed = heroFixedFieldsByEmail.get(String(dup.Email || '').toLowerCase()) || {};
        stats.pairs++;

        for (const field of IDENTITY_FIELDS) {
            if (field in fixed || dup[field] === orig[field]) continue;
            dup[field] = orig[field];
            stats.fieldsChanged++;
        }

        if (dup.Phone && orig.Phone && dup.Phone !== orig.Phone) {
            const dupId = label.PersonID.toLowerCase();
            for (const c of contactMethods) {
                const cm = c.fields;
                if (String(cm.PersonID || '').toLowerCase() === dupId && cm.IsPrimary && isPhoneType(cm.ContactTypeID) && cm.Value === dup.Phone) {
                    cm.Value = orig.Phone;
                }
            }
            dup.Phone = orig.Phone;
            stats.fieldsChanged++;
            stats.phonesAligned++;
        }

        const shape = DEFECT_VALUE_SHAPE.exec(String(label.DefectValue || ''));
        if (!shape) throw new Error(`DuplicatePerson label ${label.LabelKey || ''} has DefectValue ${JSON.stringify(label.DefectValue)}, not "<name> (<code>)"`);
        const defectValue = `${dup.FirstName} ${dup.LastName} ${shape[1]}`;
        if (label.DefectValue !== defectValue) {
            label.DefectValue = defectValue;
            stats.labelsRenamed++;
        }
    }
    return stats;
}
