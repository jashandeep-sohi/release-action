const mockGetInput = jest.fn();
const mockGlob = jest.fn()
const mockReadFileSync = jest.fn();
const mockStatSync = jest.fn();

import {Artifact} from "../src/Artifact";
import {ArtifactGlobber} from "../src/ArtifactGlobber";
import {Context} from "@actions/github/lib/context";
import {Inputs, CoreInputs} from "../src/Inputs";

const artifacts = [
    new Artifact('a/art1'),
    new Artifact('b/art2')
]

jest.mock('@actions/core', () => {
    return {getInput: mockGetInput};
})

jest.mock('fs', () => {
    // existsSync is used by Context's constructor
    // noinspection JSUnusedGlobalSymbols
    return {
        existsSync: () => {
            return false
        },
        readFileSync: mockReadFileSync,
        statSync: mockStatSync
    };
})

describe('Inputs', () => {
    let context: Context;
    let inputs: Inputs;
    beforeEach(() => {
        mockGetInput.mockReset()
        context = new Context()
        inputs = new CoreInputs(createGlobber(), context)
    })

    it('returns targetCommit', () => {
        mockGetInput.mockReturnValue('42')
        expect(inputs.commit).toBe('42')
    })

    it('returns token', () => {
        mockGetInput.mockReturnValue('42')
        expect(inputs.token).toBe('42')
    })

    describe('allowsUpdates', () => {
        it('returns false', () => {
            expect(inputs.allowUpdates).toBe(false)
        })

        it('returns true', () => {
            mockGetInput.mockReturnValue('true')
            expect(inputs.allowUpdates).toBe(true)
        })
    })

    describe('artifactErrorsFailBuild', () => {
        it('returns false', () => {
            expect(inputs.artifactErrorsFailBuild).toBe(false)
        })

        it('returns true', () => {
            mockGetInput.mockReturnValue('true')
            expect(inputs.artifactErrorsFailBuild).toBe(true)
        })
    })

    describe('artifacts', () => {
        it('globber told to throw errors', () => {
            mockGetInput.mockReturnValueOnce('art1')
                .mockReturnValueOnce('contentType')
                .mockReturnValueOnce('true')

            expect(inputs.artifacts).toEqual(artifacts)
            expect(mockGlob).toBeCalledTimes(1)
            expect(mockGlob).toBeCalledWith('art1', 'contentType', true)
        })
        
        it('returns empty artifacts', () => {
            mockGetInput.mockReturnValueOnce('')
                .mockReturnValueOnce('')

            expect(inputs.artifacts).toEqual([])
            expect(mockGlob).toBeCalledTimes(0)
        })

        it('returns input.artifacts', () => {
            mockGetInput.mockReturnValueOnce('art1')
                .mockReturnValueOnce('contentType')
                .mockReturnValueOnce('false')

            expect(inputs.artifacts).toEqual(artifacts)
            expect(mockGlob).toBeCalledTimes(1)
            expect(mockGlob).toBeCalledWith('art1', 'contentType', false)
        })

        it('returns input.artifacts with default contentType', () => {
            mockGetInput.mockReturnValueOnce('art1')
                .mockReturnValueOnce('raw')
                .mockReturnValueOnce('false')

            expect(inputs.artifacts).toEqual(artifacts)
            expect(mockGlob).toBeCalledTimes(1)
            expect(mockGlob).toBeCalledWith('art1', 'raw', false)
        })

        it('returns input.artifact', () => {
            mockGetInput.mockReturnValueOnce('')
                .mockReturnValueOnce('art2')
                .mockReturnValueOnce('contentType')
                .mockReturnValueOnce('false')

            expect(inputs.artifacts).toEqual(artifacts)
            expect(mockGlob).toBeCalledTimes(1)
            expect(mockGlob).toBeCalledWith('art2', 'contentType', false)
        })
    })

    describe('createdReleaseBody', () => {
        it('returns input body', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('body')
            expect(inputs.createdReleaseBody).toBe('body')
        })

        it('returns body file contents', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('')
                .mockReturnValueOnce('a/path')
            mockReadFileSync.mockReturnValue('file')

            expect(inputs.createdReleaseBody).toBe('file')
        })

        it('returns empty', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('')
                .mockReturnValueOnce('')
            expect(inputs.createdReleaseBody).toBe('')
        })

        it('returns undefined when omitted', () => {
            mockGetInput
                .mockReturnValueOnce('true')
                .mockReturnValueOnce('body')
            expect(inputs.createdReleaseBody).toBeUndefined()
        })
    })

    describe('createdReleaseName', () => {
        it('returns input name', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('name')
            expect(inputs.createdReleaseName).toBe('name')
        })

        it('returns undefined when omitted', () => {
            mockGetInput
                .mockReturnValueOnce('true')
                .mockReturnValueOnce('name')
            expect(inputs.createdReleaseBody).toBeUndefined()
        })

        it('returns tag', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('')
            context.ref = 'refs/tags/sha-tag'
            expect(inputs.createdReleaseName).toBe('sha-tag')
        })
    })

    describe('discussionCategory', () => {
        it('returns category', () => {
            mockGetInput.mockReturnValue('Release')
            expect(inputs.discussionCategory).toBe('Release')
        })
        
        it('returns undefined', () => {
            mockGetInput.mockReturnValue('')
            expect(inputs.discussionCategory).toBe(undefined)
        })
    })

    describe('draft', () => {
        it('returns false', () => {
            expect(inputs.draft).toBe(false)
        })

        it('returns true', () => {
            mockGetInput.mockReturnValue('true')
            expect(inputs.draft).toBe(true)
        })
    })

    describe('owner', () => {
        it('returns owner from context', function () {
            process.env.GITHUB_REPOSITORY = "owner/repo"
            mockGetInput.mockReturnValue("")
            expect(inputs.owner).toBe("owner")
        });
        it('returns owner from inputs', function () {
            mockGetInput.mockReturnValue("owner")
            expect(inputs.owner).toBe("owner")
        });
    })

    describe('prerelase', () => {
        it('returns false', () => {
            expect(inputs.prerelease).toBe(false)
        })

        it('returns true', () => {
            mockGetInput.mockReturnValue('true')
            expect(inputs.prerelease).toBe(true)
        })
    })

    describe('replacesArtifacts', () => {
        it('returns false', () => {
            expect(inputs.replacesArtifacts).toBe(false)
        })

        it('returns true', () => {
            mockGetInput.mockReturnValue('true')
            expect(inputs.replacesArtifacts).toBe(true)
        })
    })

    describe('repo', () => {
        it('returns repo from context', function () {
            process.env.GITHUB_REPOSITORY = "owner/repo"
            mockGetInput.mockReturnValue("")
            expect(inputs.repo).toBe("repo")
        });
        it('returns repo from inputs', function () {
            mockGetInput.mockReturnValue("repo")
            expect(inputs.repo).toBe("repo")
        });
    })

    describe('tag', () => {
        it('returns input tag', () => {
            mockGetInput.mockReturnValue('tag')
            expect(inputs.tag).toBe('tag')
        })
        it('returns context sha when input is empty', () => {
            mockGetInput.mockReturnValue('')
            context.ref = 'refs/tags/sha-tag'
            expect(inputs.tag).toBe('sha-tag')
        })
        it('returns context sha when input is null', () => {
            mockGetInput.mockReturnValue(null)
            context.ref = 'refs/tags/sha-tag'
            expect(inputs.tag).toBe('sha-tag')
        })
        it('throws if no tag', () => {
            expect(() => inputs.tag).toThrow()
        })
    })

    describe('updatedReleaseBody', () => {
        it('returns input body', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('body')
            expect(inputs.updatedReleaseBody).toBe('body')
        })

        it('returns body file contents', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('')
                .mockReturnValueOnce('a/path')
            mockReadFileSync.mockReturnValue('file')

            expect(inputs.updatedReleaseBody).toBe('file')
        })

        it('returns empty', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('')
                .mockReturnValueOnce('')
            expect(inputs.updatedReleaseBody).toBe('')
        })

        it('returns undefined when omitted', () => {
            mockGetInput
                .mockReturnValueOnce('true')
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('body')
            expect(inputs.updatedReleaseBody).toBeUndefined()
        })

        it('returns undefined when omitted for update', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('true')
                .mockReturnValueOnce('body')
            expect(inputs.updatedReleaseBody).toBeUndefined()
        })
    })

    describe('updatedReleaseName', () => {
        it('returns input name', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('name')
            expect(inputs.updatedReleaseName).toBe('name')
        })

        it('returns undefined when omitted', () => {
            mockGetInput
                .mockReturnValueOnce('true')
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('name')
            expect(inputs.updatedReleaseName).toBeUndefined()
        })

        it('returns undefined when omitted for update', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('true')
                .mockReturnValueOnce('name')
            expect(inputs.updatedReleaseName).toBeUndefined()
        })

        it('returns tag', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('')
            context.ref = 'refs/tags/sha-tag'
            expect(inputs.updatedReleaseName).toBe('sha-tag')
        })
    })

    describe('updatedPrerelease', () => {
        it('returns false', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('false')
            expect(inputs.updatedPrerelease).toBe(false)
        })

        it('returns true', () => {
            mockGetInput
                .mockReturnValueOnce('false')
                .mockReturnValueOnce('true')
            expect(inputs.updatedPrerelease).toBe(true)
        })

        it('returns undefined when omitted for update', () => {
            mockGetInput
                .mockReturnValueOnce('true')
                .mockReturnValueOnce('false')
            expect(inputs.updatedPrerelease).toBeUndefined()
        })
    })

    function createGlobber(): ArtifactGlobber {
        const MockGlobber = jest.fn<ArtifactGlobber, any>(() => {
            return {
                globArtifactString: mockGlob
            }
        })
        mockGlob.mockImplementation(() => artifacts)
        return new MockGlobber()
    }
})
