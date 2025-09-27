import { NextRequest, NextResponse } from 'next/server'
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js'

interface IRequestPayload {
	payload: ISuccessResult
	action: string
	signal: string | undefined
}

export async function POST(req: NextRequest) {
	const { payload, action, signal } = (await req.json()) as IRequestPayload
	const app_id = process.env.NEXT_PUBLIC_APP_ID as `app_${string}`

	try {
		const verifyRes = (await verifyCloudProof(payload, app_id, action, signal)) as IVerifyResponse

		if (verifyRes.success) {
			// Verification succeeded. You can now perform backend actions,
			// like setting a user as "verified" in your database.
			return NextResponse.json({ verifyRes, status: 200 })
		} else {
			// Handle errors from the World ID /verify endpoint.
			// Usually, these are due to a user having already verified.
			return NextResponse.json({ verifyRes, status: 400 })
		}
	} catch (error) {
		console.error('Verification failed:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}