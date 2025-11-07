# s3-utils

Ensemble de fonctions d'aide à la manipulation de données à travers des stockages objets compatibles S3.

### Utilisation

#### getS3Client(config?)

Renvoie l'instance de la classe S3Client permettant de faire la communication avec le stockage S3. Si elle n'est pas initialisé, la fonction la crée grace à la configuration entrée en paramètres.

Note: Il n'y a besoin d'envoyer la configuration uniquement au premier appel.

L'objet de configuration doit être de cette forme:

```javascript
config: {
  endpoint: string; // URL du stockage objet S3
  credentials: {
    accessKeyId: string; // ID de clé d'accès (ou nom d'utilisateur)
    secretAccessKey: string; // Clé d'accès secrète (ou mot de passe)
  }
}
```

#### async putFileToS3(bucket, key, file, s3Client?)

Envoie un fichier vers le stockage S3 dans le bucket avec la clé référencée. Si aucun client S3 n'est rérérencé, la valeur par défaut est le résultat de la fonction `getS3Client` sans objet de configuration.

Note: Si le client n'a pas été instancié avant l'appel de cette fonction, et qu'aucun client n'est en paramètre de la fonction, celle-ci renvoie une erreur.

Paramètres:
| Paramètre | Description |
| --- | --- |
| bucket | Nom du bucket dans lequel la fonction va envoyer le fichier |
| key | Clé du fichier une fois inscrit dans le stockage (arborescence + nom de fichier) |
| file | Fichier à envoyer au stockage |
| s3Client? | Client S3 (optionnel) |

#### async getFileFromS3(bucket, key, file, s3Client?)

Récupère un fichier du stockage S3 dans le bucket avec la clé référencée. Si aucun client S3 n'est rérérencé, la valeur par défaut est le résultat de la fonction `getS3Client` sans objet de configuration.

Note: Si le client n'a pas été instancié avant l'appel de cette fonction, et qu'aucun client n'est en paramètre de la fonction, celle-ci renvoie une erreur.

Paramètres:
| Paramètre | Description |
| --- | --- |
| bucket | Nom du bucket dans lequel la fonction va envoyer le fichier |
| key | Clé du fichier une fois inscrit dans le stockage (arborescence + nom de fichier) |
| file | Fichier à envoyer au stockage |
| s3Client? | Client S3 (optionnel) |

Le fichier retourné est de type GetObjectCommandOutput (Plus d'informations sur [Cette page](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-s3/Interface/GetObjectCommandOutput/)).
