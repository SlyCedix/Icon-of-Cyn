import Level from 'level'
import Sub from 'subleveldown'

export const Database = Level('db');

export async function prepareDB() {
    const ReactionRolesDB = Sub(Database, 'reactionroles');
    await ReactionRolesDB.put('manifest', JSON.stringify([]))
}