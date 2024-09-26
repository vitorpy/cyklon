#[cfg(test)]
mod tests {
    use crate::constants::VERIFYINGKEY;
    use groth16_solana::groth16::Groth16Verifier;

    // Concatenated proof (Proof A + Proof B + Proof C)
    const PROOF: [u8; 256] = [
        // Proof A (64 bytes)
        12, 0, 222, 78, 3, 131, 37, 247, 76, 216, 27, 63, 163, 4, 235, 59, 152, 185, 182, 15, 205,
        25, 146, 134, 70, 185, 239, 148, 12, 23, 91, 17, 20, 169, 124, 14, 45, 171, 17, 195, 181,
        108, 63, 160, 85, 107, 6, 117, 78, 228, 212, 91, 72, 83, 244, 83, 248, 182, 209, 19, 70,
        132, 65, 178,
        // Proof B (128 bytes)
        12, 138, 234, 209, 175, 228, 30, 146, 163, 225, 224, 25, 185, 197, 243, 221, 126, 191, 211,
        227, 91, 75, 108, 148, 251, 98, 49, 81, 143, 65, 118, 76, 47, 101, 90, 80, 164, 107, 239,
        199, 93, 103, 79, 240, 95, 66, 179, 233, 189, 166, 115, 17, 41, 196, 55, 167, 213, 133,
        200, 63, 88, 58, 78, 176, 44, 126, 171, 151, 214, 112, 102, 12, 114, 82, 57, 152, 113, 49,
        142, 64, 112, 46, 178, 129, 26, 4, 7, 132, 97, 253, 176, 141, 22, 88, 20, 102, 2, 200, 116,
        93, 133, 12, 143, 209, 213, 171, 70, 112, 52, 240, 221, 110, 6, 114, 191, 123, 155, 15,
        133, 128, 11, 154, 40, 6, 125, 199, 137, 206,
        // Proof C (64 bytes)
        22, 41, 146, 82, 18, 74, 36, 216, 33, 188, 80, 112, 238, 154, 185, 236, 112, 163, 108, 67,
        38, 229, 221, 165, 247, 189, 21, 71, 72, 54, 22, 237, 45, 43, 120, 151, 210, 215, 55, 124,
        162, 162, 253, 219, 244, 212, 208, 41, 18, 52, 199, 111, 46, 92, 174, 125, 167, 127, 158,
        98, 67, 69, 153, 104,
    ];

    // Public inputs (3 x 32-byte arrays)
    const PUBLIC_INPUTS: [[u8; 32]; 3] = [
        [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            16, 200, 224,
        ],
        [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            28, 253, 224,
        ],
        [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            1, 134, 160,
        ],
    ];

    #[test]
    fn zk_constant_sum_amm_proof_verification_should_succeed() {
        let proof_a: [u8; 64] = PROOF[0..64].try_into().expect("Failed to convert proof_a");
        let proof_b: [u8; 128] = PROOF[64..192]
            .try_into()
            .expect("Failed to convert proof_b");
        let proof_c: [u8; 64] = PROOF[192..256]
            .try_into()
            .expect("Failed to convert proof_c");

        let mut verifier =
            match Groth16Verifier::new(&proof_a, &proof_b, &proof_c, &PUBLIC_INPUTS, &VERIFYINGKEY)
            {
                Ok(v) => v,
                Err(e) => panic!("Failed to create verifier: {:?}", e),
            };

        println!("Verifier created successfully");

        match verifier.verify() {
            Ok(true) => println!("Proof verified successfully"),
            Ok(false) => panic!("Proof verification returned false"),
            Err(e) => panic!("Proof verification failed with error: {:?}", e),
        }
    }
}
