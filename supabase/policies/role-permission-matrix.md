# Role and permission matrix

| Role                    | Primary scope                         | MFA | Explicit exclusions                                     |
| ----------------------- | ------------------------------------- | --: | ------------------------------------------------------- |
| Member                  | Assigned member content               |  No | Other groups, child records, administration             |
| Verified guardian       | Own household and linked children     |  No | Other households and children                           |
| Teen                    | Approved teen channels                |  No | Adult DMs, parent administration, child records         |
| Group leader            | Groups they lead                      |  No | Pastoral/safeguarding constraints outside assignment    |
| Kids volunteer          | Assigned class during service window  |  No | Full child records, custody flags, unrelated classes    |
| Content editor          | Draft content                         | Yes | Role management, safeguarding, infrastructure           |
| Minister                | Publish content and manage ministries | Yes | Technical secrets and unrestricted safeguarding details |
| Moderator               | Reports and community actions         | Yes | Child care records and infrastructure secrets           |
| Safety administrator    | Child safety and safeguarding         | Yes | Social campaigns and infrastructure secrets by default  |
| Technical administrator | Health, backups, integrations         | Yes | Prayer, pastoral, child, and safeguarding content       |
| Super administrator     | Emergency use only                    | Yes | Membership must be extremely limited and reviewed       |

The TypeScript permission map in `packages/authorization` mirrors these product-level permissions. PostgreSQL remains the final enforcement boundary.
