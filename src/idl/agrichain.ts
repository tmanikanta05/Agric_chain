/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/agrichain.json`.
 */
export type Agrichain = {
  "address": "4hMPxgjyhscXa7iFYVd68DpXHQFsfXbcxBdEog1cfACv",
  "metadata": {
    "name": "agrichain",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "assignBroker",
      "discriminator": [
        102,
        132,
        114,
        67,
        167,
        47,
        159,
        190
      ],
      "accounts": [
        {
          "name": "collector",
          "writable": true,
          "signer": true
        },
        {
          "name": "crop",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "broker",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "brokerAccept",
      "discriminator": [
        58,
        248,
        243,
        92,
        201,
        203,
        187,
        187
      ],
      "accounts": [
        {
          "name": "broker",
          "writable": true,
          "signer": true
        },
        {
          "name": "crop",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "finalWeight",
          "type": "u64"
        },
        {
          "name": "manufacturer",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "labTest",
      "discriminator": [
        9,
        33,
        151,
        88,
        7,
        203,
        117,
        181
      ],
      "accounts": [
        {
          "name": "lab",
          "signer": true
        },
        {
          "name": "crop",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "results",
          "type": {
            "vec": "string"
          }
        },
        {
          "name": "approved",
          "type": "bool"
        }
      ]
    },
    {
      "name": "manufacturerProcess",
      "discriminator": [
        77,
        85,
        195,
        231,
        211,
        231,
        238,
        72
      ],
      "accounts": [
        {
          "name": "manufacturer",
          "signer": true
        },
        {
          "name": "crop",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "processingType",
          "type": "u8"
        },
        {
          "name": "qualityGrade",
          "type": "u8"
        },
        {
          "name": "moisture",
          "type": "u8"
        },
        {
          "name": "packageType",
          "type": "u8"
        },
        {
          "name": "totalPackages",
          "type": "u16"
        },
        {
          "name": "packagingMaterial",
          "type": "string"
        },
        {
          "name": "lab",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "registerFarmer",
      "discriminator": [
        63,
        234,
        139,
        94,
        48,
        7,
        57,
        201
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "farmer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  97,
                  114,
                  109,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "crop",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  114,
                  111,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "farmerName",
          "type": "string"
        },
        {
          "name": "mobile",
          "type": "string"
        },
        {
          "name": "aadhaar",
          "type": "string"
        },
        {
          "name": "geoLocation",
          "type": "string"
        },
        {
          "name": "district",
          "type": "u8"
        },
        {
          "name": "cropType",
          "type": "u8"
        },
        {
          "name": "approxWeight",
          "type": "u64"
        },
        {
          "name": "collectionDate",
          "type": "i64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "crop",
      "discriminator": [
        205,
        81,
        233,
        203,
        14,
        207,
        3,
        229
      ]
    },
    {
      "name": "farmer",
      "discriminator": [
        254,
        63,
        81,
        98,
        130,
        38,
        28,
        219
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Unauthorized Access"
    },
    {
      "code": 6001,
      "name": "invalidAadhaar",
      "msg": "Invalid Aadhaar"
    }
  ],
  "types": [
    {
      "name": "crop",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "cropId",
            "type": "string"
          },
          {
            "name": "farmer",
            "type": "pubkey"
          },
          {
            "name": "collector",
            "type": "pubkey"
          },
          {
            "name": "broker",
            "type": "pubkey"
          },
          {
            "name": "manufacturer",
            "type": "pubkey"
          },
          {
            "name": "lab",
            "type": "pubkey"
          },
          {
            "name": "cropType",
            "type": "u8"
          },
          {
            "name": "approxWeight",
            "type": "u64"
          },
          {
            "name": "finalWeight",
            "type": "u64"
          },
          {
            "name": "collectionDate",
            "type": "i64"
          },
          {
            "name": "processingType",
            "type": "u8"
          },
          {
            "name": "qualityGrade",
            "type": "u8"
          },
          {
            "name": "moisture",
            "type": "u8"
          },
          {
            "name": "packageType",
            "type": "u8"
          },
          {
            "name": "totalPackages",
            "type": "u16"
          },
          {
            "name": "packagingMaterial",
            "type": "string"
          },
          {
            "name": "testResults",
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "farmer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "mobile",
            "type": "string"
          },
          {
            "name": "aadhaar",
            "type": "string"
          },
          {
            "name": "location",
            "type": "string"
          },
          {
            "name": "district",
            "type": "u8"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};

import idlJson from "./agrichain.json";
export const IDL = idlJson as unknown as Agrichain;

