#[cfg(test)]
mod tests {
    use crate::constants::VERIFYINGKEY;
    use groth16_solana::groth16::Groth16Verifier;

    // Concatenated proof (Proof A + Proof B + Proof C)
    const PROOF: [u8; 256] = [
        // Proof A (64 bytes)
        35, 104, 246, 191, 210, 18, 211, 199, 185, 250, 96, 182, 119, 39, 177, 130, 
        108, 154, 188, 159, 91, 99, 115, 221, 92, 22, 181, 15, 18, 97, 168, 69, 
        40, 254, 2, 181, 211, 155, 189, 127, 6, 152, 39, 90, 182, 166, 44, 11, 
        81, 152, 125, 233, 108, 170, 17, 162, 140, 113, 131, 233, 254, 93, 60, 36,
        // Proof B (128 bytes)
        21, 62, 160, 0, 111, 103, 80, 59, 1, 195, 93, 43, 238, 50, 197, 187,
        231, 163, 191, 113, 195, 83, 197, 151, 147, 46, 131, 4, 47, 139, 203, 95,
        46, 46, 126, 204, 82, 220, 231, 198, 225, 7, 80, 93, 248, 242, 234, 172,
        9, 180, 16, 232, 122, 84, 58, 77, 245, 5, 195, 89, 84, 87, 78, 65,
        6, 228, 71, 189, 218, 44, 66, 27, 201, 61, 219, 133, 82, 15, 86, 70,
        42, 64, 223, 0, 24, 143, 51, 62, 40, 108, 107, 78, 63, 24, 177, 191,
        16, 187, 68, 221, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        // Proof C (64 bytes)
        5, 239, 28, 23, 210, 203, 213, 36, 122, 177, 99, 184, 227, 221, 68, 8,
        119, 60, 102, 101, 156, 138, 130, 128, 77, 42, 128, 80, 215, 129, 88, 56,
        2, 239, 184, 138, 140, 17, 38, 3, 206, 198, 144, 109, 139, 218, 139, 124,
        212, 156, 194, 139, 158, 155, 2, 122, 218, 114, 56, 151, 237, 155, 142, 213
    ];

    // Public inputs (3 x 32-byte arrays)
    const PUBLIC_INPUTS: [[u8; 32]; 3] = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 200, 224],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 253, 224],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 134, 160]
    ];

    #[test]
    fn zk_constant_sum_amm_proof_verification_should_succeed() {
        let proof_a: [u8; 64] = PROOF[0..64].try_into().expect("Failed to convert proof_a");
        let proof_b: [u8; 128] = PROOF[64..192].try_into().expect("Failed to convert proof_b");
        let proof_c: [u8; 64] = PROOF[192..256].try_into().expect("Failed to convert proof_c");

        println!("Proof A: {:?}", proof_a);
        println!("Proof B: {:?}", proof_b);
        println!("Proof C: {:?}", proof_c);
        println!("Public Inputs: {:?}", PUBLIC_INPUTS);

        let mut verifier = match Groth16Verifier::new(
            &proof_a,
            &proof_b,
            &proof_c,
            &PUBLIC_INPUTS,
            &VERIFYINGKEY
        ) {
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